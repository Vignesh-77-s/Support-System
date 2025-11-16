import mongoose, { Document, Schema } from 'mongoose';
import { Ticket as ITicket, TicketStatus, TicketPriority } from '../../../packages/frontend/src/types';

const attachmentSchema = new Schema({
    name: String,
    size: String,
    type: String,
    url: String
});

const commentSchema = new Schema({
    user: {
        name: String,
        role: String
    },
    content: String,
    timestamp: String,
    isSystem: Boolean,
    attachments: [attachmentSchema]
});

// This interface is for the mongoose model, which uses ObjectIds for references
export interface ITicketModel extends Omit<ITicket, 'id' | 'products' | 'createdBy' | 'assignedTo'>, Document {
    products: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    assignedTo: mongoose.Types.ObjectId | null;
}

const ticketSchema: Schema<ITicketModel> = new Schema({
    id: { type: String, required: true, unique: true }, // Keep the custom ID like TK002
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, required: true, enum: Object.values(TicketStatus), default: TicketStatus.New },
    priority: { type: String, required: true, enum: Object.values(TicketPriority), default: TicketPriority.Medium },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    slaDeadline: { type: String, required: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    attachments: [attachmentSchema],
    comments: [commentSchema],
}, {
    // Mongoose timestamps will add createdAt and updatedAt fields of type Date
    // This conflicts with our string-based date fields. Disable it.
    timestamps: false, 
     toJSON: {
        virtuals: true,
        transform(doc, ret) {
            delete ret._id;
           delete (ret as any).__v;
        }
    }
});

const Ticket = mongoose.model<ITicketModel>('Ticket', ticketSchema);

export default Ticket;
