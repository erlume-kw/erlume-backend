// Import necessary modules
import { Request, Response } from 'express';
import User from '../models/User';
import Seller from '../models/Seller';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../enums/userEnums';
import { UserInterface } from '../interfaces/User';

// Helper function to create a seller document
const createSellerDocument = async (userId: Types.ObjectId) => {
  const seller = new Seller({
    userId,
    balance: "0", // Initial balance
    itemIds: [], // Initial empty items list
    IBAN: "", // Will be updated later by the seller
    qrCode: "", // Will be generated when IBAN is provided
    isDeactivated: false
  });
  return seller; // Return the document without saving it
};

const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ isDeleted: false });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findOne({ _id: userId, isDeleted: false });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // If user is a seller, fetch seller information
    let sellerInfo = null;
    if (user.roles.includes(UserRole.SELLER)) {
      sellerInfo = await Seller.findOne({ userId: user._id });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        user,
        seller: sellerInfo
      }
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const createUser = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { username, password, emailAddress, phoneNumber, address, roles } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      password: hashedPassword,
      emailAddress,
      phoneNumber,
      address,
      roles: roles || [UserRole.USER], // Default role is 'user'
      cardIds: [],
      isDeleted: false
    });

    const savedUser = await user.save({ session }) as UserInterface & { _id: Types.ObjectId };

    // If user has seller role, create seller document
    let sellerDoc = null;
    if (roles && roles.includes(UserRole.SELLER)) {
      sellerDoc = await createSellerDocument(savedUser._id);
      await sellerDoc.save({ session });
    }

    await session.commitTransaction();
    
    res.status(201).json({ 
      success: true,
      data: {
        user: savedUser,
        seller: sellerDoc
      }
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Error in createUser:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username or email already exists' 
      });
    }
    
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    session.endSession();
  }
};

const updateUser = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.params.id;
    const updateData = req.body;
    
    // Don't allow direct role updates through this endpoint
    delete updateData.roles;
    
    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      updateData,
      { new: true, session }
    );

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await session.commitTransaction();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in updateUser:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    session.endSession();
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.params.id;
    
    // Soft delete the user
    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      { isDeleted: true },
      { new: true, session }
    );

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // If user is a seller, deactivate seller account
    if (user.roles.includes(UserRole.SELLER)) {
      await Seller.findOneAndUpdate(
        { userId: user._id },
        { isDeactivated: true },
        { session }
      );
    }

    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in deleteUser:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    session.endSession();
  }
};

const updateSellerInfo = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.params.id;
    const { IBAN } = req.body;

    // Verify user exists and is a seller
    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.roles.includes(UserRole.SELLER)) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, error: 'User is not a seller' });
    }

    // Update seller information
    const seller = await Seller.findOneAndUpdate(
      { userId: user._id },
      { 
        IBAN,
        qrCode: `QR_${IBAN}` // Generate QR code based on IBAN (implement proper QR generation)
      },
      { new: true, session }
    );

    if (!seller) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Seller information not found' });
    }

    await session.commitTransaction();
    res.status(200).json({ success: true, data: seller });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in updateSellerInfo:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    session.endSession();
  }
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateSellerInfo
};
  