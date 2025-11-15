import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { addedBy, amount, location, usersPresent, timestamp, ip } = body;

    if (!addedBy || !amount || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('expense-tracker');

    const expense = {
      addedBy,
      amount: parseFloat(amount),
      location,
      usersPresent: usersPresent || [],
      timestamp,
      ip,
      createdAt: new Date()
    };

    await db.collection('expenses').insertOne(expense);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to restore expense' }, { status: 500 });
  }
}
