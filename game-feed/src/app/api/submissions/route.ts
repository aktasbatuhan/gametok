import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// POST /api/submissions - Create a new game submission
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { name, email, gameTitle, gameDescription, gameRepoUrl } = body;
    
    if (!name || !email || !gameTitle || !gameDescription || !gameRepoUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const submissionsCollection = db.collection('submissions');
    
    // Create submission with pending status
    const submission = {
      name,
      email,
      gameTitle,
      gameDescription,
      gameRepoUrl,
      status: 'pending',
      createdAt: new Date()
    };
    
    // Insert into database
    const result = await submissionsCollection.insertOne(submission);
    
    if (result.acknowledged) {
      return NextResponse.json({ 
        success: true, 
        message: 'Submission received successfully' 
      });
    } else {
      throw new Error('Failed to insert submission');
    }
  } catch (error) {
    console.error('Error in submissions API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Note: This allows GET requests to retrieve all submissions (admin feature)
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const submissions = await db.collection('submissions').find({}).toArray();
    
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}