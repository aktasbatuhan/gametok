import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

interface RouteContext {
  params: {
    id: string;
  };
}

// GET /api/submissions/[id] - Get a specific submission
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const id = params.id;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid submission ID' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db('gametok-demo'); // Specify the database name
    
    const submission = await db.collection('submissions').findOne({
      _id: new ObjectId(id)
    });
    
    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

// PATCH /api/submissions/[id] - Update a submission (e.g., change status)
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid submission ID' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db('gametok-demo'); // Specify the database name
    
    // Only allow updating specific fields
    const allowedUpdates = ['status'];
    const updates: Record<string, any> = {};
    
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid updates provided' },
        { status: 400 }
      );
    }
    
    const result = await db.collection('submissions').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Submission updated successfully' 
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update submission' },
      { status: 500 }
    );
  }
}