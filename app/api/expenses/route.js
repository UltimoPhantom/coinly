import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('expense-tracker');
    
    const expenses = await db
      .collection('expenses')
      .find({})
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { addedBy, amount, location, usersPresent } = body;

    if (!addedBy || !amount || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('expense-tracker');

    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    const expense = {
      addedBy,
      amount: parseFloat(amount),
      location,
      usersPresent: usersPresent || [],
      timestamp: new Date().toISOString(),
      ip,
      createdAt: new Date()
    };

    const result = await db.collection('expenses').insertOne(expense);

    return NextResponse.json({ success: true, expense: { ...expense, _id: result.insertedId } });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, addedBy, amount, location, usersPresent } = body;

    if (!id || !addedBy || !amount || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('expense-tracker');

    const result = await db.collection('expenses').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          addedBy,
          amount: parseFloat(amount),
          location,
          usersPresent: usersPresent || [],
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error:'Expense not found' }, { status: 404 });
}
return NextResponse.json({ success: true });
} catch (error) {
console.error('Error updating expense:', error);
return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
}
}
export async function DELETE(request) {
try {
const body = await request.json();
const { id } = body;
if (!id) {
  return NextResponse.json({ error: 'ID is required' }, { status: 400 });
}

const client = await clientPromise;
const db = client.db('expense-tracker');

await db.collection('expenses').deleteOne({ _id: new ObjectId(id) });

return NextResponse.json({ success: true });
} catch (error) {
console.error('Error deleting expense:', error);
return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
}
}
