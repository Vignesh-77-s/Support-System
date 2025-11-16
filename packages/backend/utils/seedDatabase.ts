import mongoose from 'mongoose';
import User from '../models/User';
import Product from '../models/Product';
import Ticket from '../models/Ticket';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';
import { mockUsers, mockProducts, mockTickets, mockNotifications, mockAuditLogs } from '../../../frontend/src/data';

const seedDatabase = async () => {
    try {
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Product.deleteMany({});
        await Ticket.deleteMany({});
        await Notification.deleteMany({});
        await AuditLog.deleteMany({});
        console.log('Data cleared.');

        console.log('Seeding users...');
        const usersWithPasswords = mockUsers.map(user => ({ ...user, password: 'password123' }));
        const createdUsers = await User.insertMany(usersWithPasswords);
        console.log('Users seeded.');

        console.log('Seeding products...');
        const createdProducts = await Product.insertMany(mockProducts);
        console.log('Products seeded.');

        console.log('Seeding tickets...');
        const ticketsToSeed = mockTickets.map(ticket => {
             const productIds = ticket.products.map(p => {
                const found = createdProducts.find(cp => cp.name === p.name);
                return found ? found._id : null;
            }).filter(id => id !== null);

            const creator = createdUsers.find(u => u.name === ticket.createdBy.name);
            const assignee = ticket.assignedTo ? createdUsers.find(u => u.name === ticket.assignedTo!.name) : null;

            return { 
                ...ticket,
                products: productIds,
                createdBy: creator ? creator._id : new mongoose.Types.ObjectId(), // Fallback just in case
                assignedTo: assignee ? assignee._id : null
            };
        });
        await Ticket.insertMany(ticketsToSeed);
        console.log('Tickets seeded.');

        console.log('Seeding notifications...');
        await Notification.insertMany(mockNotifications);
        console.log('Notifications seeded.');

        console.log('Seeding audit logs...');
        await AuditLog.insertMany(mockAuditLogs);
        console.log('Audit logs seeded.');

        console.log('Database seeded successfully!');

    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

export default seedDatabase;
