import validator from 'validator';
import { WholesalerApplication, User } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';
import { appEvents } from '../utils/eventBus.js';
import { deleteUploadedFile, uploadedFilePublicPath } from '../middleware/upload.js';

function uploadedPath(req, field) {
  const file = req.files?.[field]?.[0];
  return file ? uploadedFilePublicPath('wholesale', file) : null;
}

/** The customer's latest application (or null) plus whether they're already a wholesaler. */
export async function getMyApplication(req, res) {
  const [application, user] = await Promise.all([
    WholesalerApplication.findOne({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-validIdImage -businessPermitImage -proofOfBusinessImage'),
    User.findById(req.user.id).select('isWholesaler businessName'),
  ]);
  res.json({ success: true, application, isWholesaler: Boolean(user?.isWholesaler), businessName: user?.businessName || null });
}

export async function submitApplication(req, res, next) {
  const uploaded = ['validIdImage', 'businessPermitImage', 'proofOfBusinessImage'].map((f) => uploadedPath(req, f));
  const [validIdImage, businessPermitImage, proofOfBusinessImage] = uploaded;

  try {
    const { fullName, contactNumber, email, businessName, businessAddress } = req.body;
    if (!fullName?.trim() || !contactNumber?.trim() || !email?.trim() || !businessName?.trim() || !businessAddress?.trim()) {
      throw new HttpError(400, 'Please fill in all required fields.');
    }
    if (!validator.isEmail(email.trim())) throw new HttpError(400, 'Please enter a valid email address.');
    if (!validIdImage) throw new HttpError(400, 'Please upload a valid government-issued ID.');

    const user = await User.findById(req.user.id).select('isWholesaler');
    if (user?.isWholesaler) throw new HttpError(400, 'Your account is already a verified wholesaler.');
    if (await WholesalerApplication.exists({ user: req.user.id, status: 'Pending' })) {
      throw new HttpError(400, 'You already have an application under review.');
    }

    const application = await WholesalerApplication.create({
      user: req.user.id,
      fullName: fullName.trim(),
      contactNumber: contactNumber.trim(),
      email: email.trim(),
      businessName: businessName.trim(),
      businessAddress: businessAddress.trim(),
      validIdImage,
      businessPermitImage,
      proofOfBusinessImage,
    });

    appEvents.emit('wholesale:created', {
      _id: application._id,
      name: application.businessName,
      location: application.businessAddress,
    });

    res.status(201).json({ success: true, message: 'Application submitted! We will review it shortly.' });
  } catch (err) {
    await Promise.all(uploaded.map(deleteUploadedFile));
    next(err);
  }
}

export async function listApplications(req, res) {
  const filter = {};
  if (['Pending', 'Approved', 'Rejected'].includes(req.query.status)) filter.status = req.query.status;
  const applications = await WholesalerApplication.find(filter).sort({ createdAt: -1 }).populate('user', 'firstName lastName email');
  const pendingCount = await WholesalerApplication.countDocuments({ status: 'Pending' });
  res.json({ success: true, applications, pendingCount });
}

/** Approve -> account becomes a wholesaler. Reject -> stays a regular customer, with a reason. */
export async function reviewApplication(req, res) {
  const { action, reason } = req.body;
  if (!['approve', 'reject'].includes(action)) throw new HttpError(400, 'Invalid action.');
  if (action === 'reject' && !reason?.trim()) throw new HttpError(400, 'Please give a reason for rejecting this application.');

  const application = await WholesalerApplication.findById(req.params.id);
  if (!application) throw new HttpError(404, 'Application not found.');
  if (application.status !== 'Pending') throw new HttpError(400, 'This application has already been reviewed.');

  application.status = action === 'approve' ? 'Approved' : 'Rejected';
  application.rejectionReason = action === 'reject' ? reason.trim() : null;
  application.reviewedAt = new Date();
  await application.save();

  if (action === 'approve') {
    await User.findByIdAndUpdate(application.user, { isWholesaler: true, businessName: application.businessName });
  }

  res.json({ success: true, application });
}
