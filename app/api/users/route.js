import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('expense-tracker');
    
    let config = await db.collection('config').findOne({ _id: 'users' });
    
    // Initialize with default users if not exists
    if (!config) {
      config = { _id: 'users', users: ['AAA', 'BBB', 'CCC', 'DDD', 'EEE'] };
      await db.collection('config').insertOne(config);
    }

    return NextResponse.json({ users: config.users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received body:', body); // Debug log
    
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      console.error('Invalid name:', name); // Debug log
      return NextResponse.json({ error: 'Name is required and must be a valid string' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('expense-tracker');

    const result = await db.collection('config').updateOne(
      { _id: 'users' },
      { $addToSet: { users: name.trim() } },
      { upsert: true }
    );

    console.log('Update result:', result); // Debug log

    return NextResponse.json({ success: true, name: name.trim() });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Failed to add user', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    console.log('Delete received body:', body); // Debug log
    
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('expense-tracker');

    const result = await db.collection('config').updateOne(
      { _id: 'users' },
      { $pull: { users: name } }
    );

    console.log('Delete result:', result); // Debug log

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user:', error);
    return NextResponse.json({ error: 'Failed to remove user', details: error.message }, { status: 500 });
  }
}
