import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, gameTitle, gameDescription, gameRepoUrl } = body;
    
    // Validate required fields
    if (!name || !email || !gameTitle || !gameDescription || !gameRepoUrl) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('gametok');
    
    // Create submission record
    const result = await db.collection('submissions').insertOne({
      name,
      email,
      gameTitle,
      gameDescription,
      gameRepoUrl,
      status: 'pending',
      createdAt: new Date(),
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Game submission received successfully',
      id: result.insertedId
    });
  } catch (error) {
    console.error('Error processing game submission:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while processing your submission' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('gametok');
    
    // Get all submissions, sorted by date (newest first)
    const submissions = await db.collection('submissions')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ 
      success: true, 
      submissions
    });
  } catch (error) {
    console.error('Error fetching game submissions:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while fetching submissions' 
    }, { status: 500 });
  }
}