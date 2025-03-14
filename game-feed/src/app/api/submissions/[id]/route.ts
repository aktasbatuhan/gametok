import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;
    
    // Validate status
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid status value' 
      }, { status: 400 });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('gametok');
    
    // Update submission status
    const result = await db.collection('submissions').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Submission not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Submission status updated to ${status}` 
    });
  } catch (error) {
    console.error('Error updating submission status:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while updating the submission' 
    }, { status: 500 });
  }
}