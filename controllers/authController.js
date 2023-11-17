const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken');
const User = require('../models/userModel')
const catchAsyncError= require('../utils/catchAsyncError');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email')

const generateToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, statusCode, res) => {
    const token = generateToken(user._id)

    // Securing our jwt with http header only cookie
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions)

    // Remove password from data sent to client
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signUp = catchAsyncError(async (req, res, next) => {
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    createSendToken(user, 201 ,res)
    
})

exports.logIn = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Enter email and password',404))
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) return next(new AppError('please provide a valid email or password', 400));

    const correct = await user.correctPassword(password, user.password);

    console.log(password , correct )

    if (!correct) {
        return next(new AppError('please provide a valid email or password', 400));
    }
 
    createSendToken(user, 200 ,res)
    
})

exports.protect = catchAsyncError(async (req, res, next) => {
    // Getting Token => Verification token => Check if user exists => if user changed password after the token was issued

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new AppError('You are not logged in', 401));
    }
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist.'))
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) return next(new AppError('Password changed recently. Login Again', 401))
    
    // This may be used further so added it
    req.user = currentUser;

    next();
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You are not permitted to perform this action', 403))
        }
        next();
    }
}

exports.forgetPassword = catchAsyncError(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return next(new AppError('There is no user with that email address', 404));

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? 
        reset it by clicking on this url: ${resetURL}`;
    
    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token is valid for 10 minutes',
            message
        })

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        })
    } catch (err) {
        user.passwordResetToken = undefined,
            user.passwordResetExpires = undefined;
        
        await user.save({ validateBeforeSave: false })

        return next(new AppError('Some error occured sending reset email. Try again later!', 500))
            
    }

})

exports.resetPassword = catchAsyncError(async (req, res, next) => {
    // Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    
    const user = await User.findOne({
        passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() }
    })
    // If token has not expired and there is user, set the new password
    if (!user) return next(new AppError('Enter a valid token', 404));

    // Update changedPasswordAt property for the user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetExpires = undefined
    user.passwordResetToken = undefined

    await user.save()

    // Log the user in, send JWT
    createSendToken(user, 200 ,res)

})

exports.updatePassword = catchAsyncError(async (req, res, next) => {

    const user = await User.findById(req.user.id).select('+password');

    // if (!user) {
    //     return next(new AppError('Wrong jwt token',404))
    // }

    // Posted current password is correct
    const correct = await user.correctPassword(req.body.oldPassword, user.password);
    
    if (!correct) return next(new AppError('Wrong password entered', 404));

    // if so then, update password
    // if (!req.body.password || !req.body.passwordConfirm) return next(new AppError('Enter new password', 404));
    
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();
    // Log in user, send JWT

    createSendToken(user, 200 ,res)


})