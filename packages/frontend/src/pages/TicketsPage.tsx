import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  Product,
  Attachment,
  EscalationRule,
  UserRole,
  Comment,
  User,
  AuditLogAction,
} from "../types";
import { mockTickets, mockUsers, mockProducts } from "../data";
import { apiService, auditLogService, useAuth, useToast } from "../App";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import { STATUS_COLORS, PRIORITY_BADGE_COLORS } from "../constants";
import {
  Search,
  Plus,
  Paperclip,
  Image as ImageIcon,
  X,
  File as FileIcon,
  UploadCloud,
  Trash2,
  AlertTriangle,
  Settings,
  Download,
} from "lucide-react";
import {
  getUserName,
  getUserObject,
  normalizeTicket,
} from "../utils/ticketUtils";

const parseTicketDate = (dateString: string) => {
  const [datePart, timePart] = dateString.split(", ");
  if (!datePart || !timePart) return new Date();
  const [day, month, year] = datePart.split("/");
  return new Date(`${year}-${month}-${day}T${timePart}`);
};

const ImageViewerModal: React.FC<{
  src: string | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ src, isOpen, onClose }) => {
  if (!isOpen || !src) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt="Attachment Preview"
          className="w-full h-full object-contain rounded-lg"
        />
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white rounded-full p-1 text-gray-800 hover:bg-gray-200"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};

const DragAndDropInput: React.FC<{
  attachedFiles: File[];
  setAttachedFiles: (files: File[]) => void;
}> = ({ attachedFiles, setAttachedFiles }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      setAttachedFiles([...attachedFiles, ...Array.from(files)]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const removeFile = (fileIndex: number) => {
    setAttachedFiles(attachedFiles.filter((_, index) => index !== fileIndex));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Attachments (Optional)
      </label>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`mt-1 flex flex-col justify-center items-center p-6 border-2 border-dashed rounded-md transition-colors ${
          isDragging
            ? "border-neokred-primary bg-neokred-primary/10"
            : "border-gray-300"
        }`}
      >
        <UploadCloud size={32} className="text-gray-400" />
        <div className="flex text-sm text-gray-600 mt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-neokred-primary hover:text-neokred-primary-dark"
          >
            Choose files
          </button>
          <input
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files)}
            type="file"
            className="sr-only"
            multiple
          />
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
      </div>
      {attachedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected files:</h4>
          {attachedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
            >
              <div className="flex items-center gap-2">
                <FileIcon size={16} className="text-gray-500" />
                <span className="text-sm text-gray-800">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateTicketModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onTicketCreated: (ticket: Ticket) => void;
}> = ({ isOpen, onClose, products, onTicketCreated }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>(
    TicketPriority.Medium
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const toast = useToast();

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (selectedProductIds.length === 0)
      newErrors.products = "At least one product must be selected.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setPriority(TicketPriority.Medium);
    setSelectedProductIds([]);
    setAttachedFiles([]);
    setErrors({});
  }, []);

  const handleSubmit = () => {
    if (validate()) {
      const firstProduct = products.find((p) => p.id === selectedProductIds[0]);
      const prefix = firstProduct
        ? firstProduct.name.substring(0, 3).toUpperCase()
        : "TKT";
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      // const ticketId = `${prefix}-${randomNum}`;
      console.log(selectedProductIds, "---selectedProductIds");
      const newTicket: Ticket = {
        // id: ticketId,
        title: title,
        description: description,
        status: TicketStatus.New,
        priority: priority,
        createdBy: user!,
        assignedTo: null,
        createdAt: new Date().toLocaleString("en-GB"),
        updatedAt: new Date().toLocaleString("en-GB"),
        slaDeadline: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000
        ).toLocaleString("en-GB"),
        products: products.filter((p) => selectedProductIds.includes(p.id)),
        attachments: attachedFiles.map((f) => ({
          name: f.name,
          size: `${(f.size / 1024).toFixed(1)}KB`,
          type: "file",
        })),
        comments: [],
      };

      onTicketCreated(newTicket);
      toast.addToast("Ticket created successfully!", "success");
      resetForm();
      onClose();
    } else {
      toast.addToast("Please fix the errors before submitting.", "error");
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Ticket">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ticket Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Provide detailed information about the issue"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary bg-white"
          >
            {Object.values(TicketPriority).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Related Products <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => toggleProductSelection(product.id)}
                className={`flex items-center gap-3 p-3 text-left border rounded-lg transition-all ${
                  selectedProductIds.includes(product.id)
                    ? "border-neokred-primary ring-1 ring-neokred-primary bg-neokred-primary/5"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: product.color }}
                ></div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
              </button>
            ))}
          </div>
          {errors.products && (
            <p className="text-xs text-red-500 mt-1">{errors.products}</p>
          )}
        </div> */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Related Products <span className="text-red-500">*</span>
          </label>
          {products.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => toggleProductSelection(product.id)}
                  className={`flex items-center gap-3 p-3 text-left border rounded-lg transition-all ${
                    selectedProductIds.includes(product.id)
                      ? "border-neokred-primary ring-1 ring-neokred-primary bg-neokred-primary/5"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: product.color }}
                  ></div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {errors.products && (
            <p className="text-xs text-red-500 mt-1">{errors.products}</p>
          )}
        </div>
        <DragAndDropInput
          attachedFiles={attachedFiles}
          setAttachedFiles={setAttachedFiles}
        />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark"
        >
          Create Ticket
        </button>
      </div>
    </Modal>
  );
};

// const TicketDetailModal: React.FC<{
//   ticket: Ticket | null;
//   isOpen: boolean;
//   onClose: () => void;
//   setViewingImage: (url: string) => void;
//   onUpdateTicket: (updatedTicket: Ticket) => void;
// }> = ({ ticket, isOpen, onClose, setViewingImage, onUpdateTicket }) => {
//   const { addToast } = useToast();
//   const { user: currentUser } = useAuth();
//   const [isAddingComment, setIsAddingComment] = useState(false);
//   const [commentText, setCommentText] = useState("");
//   const [commentAttachedFiles, setCommentAttachedFiles] = useState<File[]>([]);
//   const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
//   const [selectedStatus, setSelectedStatus] = useState<TicketStatus | null>(
//     null
//   );

//   useEffect(() => {
//     if (ticket) {
//       setSelectedAssignee(ticket.assignedTo?.id || ""); // ✅ Set ID or empty string
//       setSelectedStatus(ticket.status);
//       setCommentText("");
//       setCommentAttachedFiles([]);
//       setIsAddingComment(false);
//     }
//   }, [ticket]);

//   if (!ticket) return null;
//   const handleAssignToMe = () => {
//     if (!currentUser?.id) {
//       addToast("Unable to assign ticket: User not found", "error");
//       return;
//     }

//     const updateData = {
//       assignedTo: currentUser.id, // ✅ Send only the ID, not entire user object
//     };

//     console.log("🔄 Assigning to me:", currentUser.id);
//     onUpdateTicket({
//       ...ticket,
//       ...updateData,
//       updatedAt: new Date().toLocaleString("en-GB"),
//     });
//     addToast(`Ticket ${ticket.id} assigned to you.`, "success");
//   };
//   // const handleAssignToMe = () => {
//   //   if (!currentUser) return;
//   //   const updatedTicket = {
//   //     ...ticket,
//   //     assignedTo: currentUser,
//   //     updatedAt: new Date().toLocaleString("en-GB"),
//   //   };
//   //   //@ts-ignore
//   //   onUpdateTicket(updatedTicket);
//   //   addToast(`Ticket ${ticket.id} assigned to you.`, "success");
//   // };

//   // const handleUpdateAssignment = () => {
//   //   if (!selectedAssignee) return;
//   //   console.log(selectedAssignee, "------selectedAssignee");
//   //   const assignedUser =
//   //     mockUsers.find((u) => u.name === selectedAssignee) || selectedAssignee;
//   //   const updatedTicket = {
//   //     ...ticket,
//   //     assignedTo: assignedUser,
//   //     updatedAt: new Date().toLocaleString("en-GB"),
//   //   };
//   //   //@ts-ignore
//   //   onUpdateTicket(updatedTicket);
//   //   addToast(`Ticket ${ticket.id} assignment updated.`, "success");
//   // };

//   const handleUpdateAssignment = () => {
//     console.log("🔄 Selected assignee:", selectedAssignee);

//     // Handle unassignment (when "Unassigned" is selected)
//     if (selectedAssignee === "" || selectedAssignee === null) {
//       const updateData = {
//         assignedTo: null, // Send null to unassign
//       };

//       console.log("🔄 Unassigning ticket");
//       onUpdateTicket({
//         ...ticket,
//         ...updateData,
//         updatedAt: new Date().toLocaleString("en-GB"),
//       });
//       addToast(`Ticket ${ticket.id} has been unassigned.`, "success");
//       return;
//     }

//     // Handle assignment - find user by ID and send only the ID
//     const assignedUser = mockUsers.find((u) => u.id === selectedAssignee);

//     if (!assignedUser) {
//       addToast("Selected user not found", "error");
//       return;
//     }

//     const updateData = {
//       assignedTo: assignedUser.id, // ✅ CORRECT: Send only the ID string
//     };

//     console.log("🔄 Assigning to user ID:", assignedUser.id);
//     onUpdateTicket({
//       ...ticket,
//       ...updateData,
//       updatedAt: new Date().toLocaleString("en-GB"),
//     });
//     addToast(
//       `Ticket ${ticket.id} assigned to ${assignedUser.name}.`,
//       "success"
//     );
//   };

//   const handleUpdateStatus = () => {
//     if (!selectedStatus) return;
//     const updatedTicket = {
//       ...ticket,
//       status: selectedStatus,
//       updatedAt: new Date().toLocaleString("en-GB"),
//     };
//     onUpdateTicket(updatedTicket);
//     addToast(
//       `Ticket ${ticket.id} status updated to "${selectedStatus}".`,
//       "success"
//     );
//   };

//   const handleAddComment = () => {
//     if (
//       (!commentText.trim() && commentAttachedFiles.length === 0) ||
//       !currentUser
//     )
//       return;

//     const newAttachments: Attachment[] = commentAttachedFiles.map((f) => ({
//       name: f.name,
//       size: `${(f.size / 1024).toFixed(1)}KB`,
//       type: f.type.startsWith("image/") ? "image" : "file",
//       url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
//     }));

//     const newComment: Comment = {
//       id: `c${Date.now()}`,
//       user: currentUser,
//       content: commentText.trim(),
//       timestamp: new Date().toLocaleString("en-GB"),
//       isSystem: false,
//       attachments: newAttachments.length > 0 ? newAttachments : undefined,
//     };
//     const updatedTicket = {
//       ...ticket,
//       comments: [...ticket.comments, newComment],
//       updatedAt: new Date().toLocaleString("en-GB"),
//     };
//     onUpdateTicket(updatedTicket);
//     addToast(`Comment added to Ticket ${ticket.id}.`, "success");
//     setCommentText("");
//     setCommentAttachedFiles([]);
//     setIsAddingComment(false);
//   };

//   const getInitials = (name: string) =>
//     name
//       .split(" ")
//       .map((n) => n[0])
//       .join("");
//   const internalUsers = mockUsers.filter((u) => u.role !== "Merchant");
//   const canPerformActions = currentUser && currentUser.role !== "Merchant";

//   const handleAttachmentClick = (att: Attachment) => {
//     if (att.type === "image" && att.url) {
//       setViewingImage(att.url);
//     }
//   };

//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={onClose}
//       title={`${ticket.id} - ${ticket.title}`}
//     >
//       <div className="flex flex-col lg:flex-row gap-6">
//         <div className="w-full lg:w-2/3 space-y-6">
//           <div>
//             <div className="flex items-center gap-2 mb-2">
//               <Badge colorClasses={STATUS_COLORS[ticket.status]}>
//                 {ticket.status}
//               </Badge>
//               <Badge colorClasses={PRIORITY_BADGE_COLORS[ticket.priority]}>
//                 {ticket.priority}
//               </Badge>
//             </div>
//             <h4 className="font-semibold text-gray-800">Description</h4>
//             <p className="text-sm text-gray-600 whitespace-pre-wrap">
//               {ticket.description}
//             </p>
//           </div>

//           <div className="border-t pt-4">
//             <h4 className="font-semibold text-gray-800 mb-2">Details</h4>
//             <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
//               <strong className="text-gray-500">Created by:</strong>
//               <span className="text-gray-700">
//                 {getUserName(ticket.createdBy)}
//               </span>
//               <strong className="text-gray-500">Assigned to:</strong>
//               <span className="text-gray-700">
//                 {getUserName(ticket.assignedTo)}
//               </span>
//               <strong className="text-gray-500">Created:</strong>
//               <span className="text-gray-700">{ticket.createdAt}</span>
//               <strong className="text-gray-500">Last updated:</strong>
//               <span className="text-gray-700">{ticket.updatedAt}</span>
//               <strong className="text-gray-500">SLA Deadline:</strong>
//               <span className="text-gray-700">{ticket.slaDeadline}</span>
//             </div>
//           </div>

//           {ticket.products.length > 0 && (
//             <div className="border-t pt-4">
//               <h4 className="font-semibold text-gray-800 mb-2">
//                 Related Products
//               </h4>
//               <div className="flex flex-wrap gap-2">
//                 {ticket.products.map((p) => (
//                   <span
//                     key={p.id}
//                     className="px-2 py-1 text-xs rounded-md"
//                     style={{ backgroundColor: `${p.color}20`, color: p.color }}
//                   >
//                     {p.name}
//                   </span>
//                 ))}
//               </div>
//             </div>
//           )}

//           {ticket.attachments.length > 0 && (
//             <div className="border-t pt-4">
//               <h4 className="font-semibold text-gray-800 mb-2">Attachments</h4>
//               {ticket.attachments.map((att) => (
//                 <button
//                   key={att.name}
//                   onClick={() => handleAttachmentClick(att)}
//                   disabled={att.type !== "image"}
//                   className="w-full flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md disabled:cursor-not-allowed hover:bg-gray-100 disabled:hover:bg-gray-50"
//                 >
//                   {att.type === "image" ? (
//                     <ImageIcon size={18} className="text-green-600" />
//                   ) : (
//                     <FileIcon size={18} className="text-gray-500" />
//                   )}
//                   <span>{att.name}</span>
//                   <span className="text-gray-400">({att.size})</span>
//                 </button>
//               ))}
//             </div>
//           )}

//           <div className="border-t pt-4">
//             <h4 className="font-semibold text-gray-800 mb-4">
//               Comments & Updates
//             </h4>
//             <div className="space-y-4">
//               {ticket.comments.map((comment) => (
//                 <div
//                   key={comment.id}
//                   className={`p-4 rounded-lg ${
//                     comment.isSystem ? "bg-blue-50" : "bg-white border"
//                   }`}
//                 >
//                   <div className="flex justify-between items-center mb-2">
//                     <div className="flex items-center gap-2">
//                       <div
//                         className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
//                           comment.isSystem
//                             ? "bg-gray-400 text-white"
//                             : "bg-neokred-primary text-white"
//                         }`}
//                       >
//                         {getInitials(comment.user.name)}
//                       </div>
//                       <span className="font-semibold text-gray-800">
//                         {comment.user.name}
//                       </span>
//                     </div>
//                     <span className="text-xs text-gray-500">
//                       {comment.timestamp}
//                     </span>
//                   </div>
//                   {comment.content && (
//                     <p className="text-sm text-gray-600 pl-10 whitespace-pre-wrap">
//                       {comment.content}
//                     </p>
//                   )}
//                   {comment.attachments && comment.attachments.length > 0 && (
//                     <div className="pl-10 mt-3 space-y-2">
//                       {comment.attachments.map((att) => (
//                         <button
//                           key={att.name}
//                           onClick={() => handleAttachmentClick(att)}
//                           disabled={att.type !== "image"}
//                           className="w-full flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md disabled:cursor-not-allowed hover:bg-gray-100 disabled:hover:bg-gray-50 text-left"
//                         >
//                           {att.type === "image" ? (
//                             <ImageIcon size={18} className="text-green-600" />
//                           ) : (
//                             <FileIcon size={18} className="text-gray-500" />
//                           )}
//                           <span>{att.name}</span>
//                           <span className="text-gray-400">({att.size})</span>
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {canPerformActions && (
//           <div className="w-full lg:w-1/3 lg:border-l lg:pl-6">
//             <div className="sticky top-0">
//               <h4 className="font-semibold text-gray-800 mb-4">Actions</h4>
//               <div className="space-y-4">
//                 <div>
//                   <label className="text-sm font-medium text-gray-700">
//                     Assignment
//                   </label>
//                   <div className="mt-1 space-y-2">
//                     <button
//                       onClick={handleAssignToMe}
//                       className="w-full px-4 py-2 bg-neokred-primary text-white text-sm rounded-md hover:bg-neokred-primary-dark"
//                     >
//                       Assign to Me
//                     </button>
//                     {/* <select
//                       value={selectedAssignee || ""}
//                       onChange={(e) => setSelectedAssignee(e.target.value)}
//                       className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary text-sm"
//                     >
//                       <option value="">Unassigned</option>
//                       {internalUsers.map((u) => (
//                         <option key={u.id} value={u.name}>
//                           {u.name} ({u.role})
//                         </option>
//                       ))}
//                     </select> */}
//                     <select
//                       value={selectedAssignee || ""}
//                       onChange={(e) => setSelectedAssignee(e.target.value)}
//                       className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary text-sm"
//                     >
//                       <option value="">Unassigned</option>
//                       {internalUsers.map((u) => (
//                         <option key={u.id} value={u.id}>
//                           {" "}
//                           {/* ✅ Use u.id as value */}
//                           {u.name} ({u.role})
//                         </option>
//                       ))}
//                     </select>
//                     <button
//                       onClick={handleUpdateAssignment}
//                       className="w-full px-4 py-2 bg-neokred-primary text-white text-sm rounded-md hover:bg-neokred-primary-dark"
//                     >
//                       Update Assignment
//                     </button>
//                   </div>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-700">
//                     Status
//                   </label>
//                   <div className="mt-1 space-y-2">
//                     <select
//                       value={selectedStatus || ""}
//                       onChange={(e) =>
//                         setSelectedStatus(e.target.value as TicketStatus)
//                       }
//                       className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary text-sm"
//                     >
//                       {Object.values(TicketStatus).map((s) => (
//                         <option key={s} value={s}>
//                           {s}
//                         </option>
//                       ))}
//                     </select>
//                     <button
//                       onClick={handleUpdateStatus}
//                       className="w-full px-4 py-2 bg-neokred-primary text-white text-sm rounded-md hover:bg-neokred-primary-dark"
//                     >
//                       Update Status
//                     </button>
//                   </div>
//                 </div>
//                 <div className="border-t pt-4">
//                   {isAddingComment ? (
//                     <div className="space-y-2">
//                       <textarea
//                         value={commentText}
//                         onChange={(e) => setCommentText(e.target.value)}
//                         rows={4}
//                         placeholder="Enter your comment..."
//                         className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary text-sm"
//                       ></textarea>
//                       <div>
//                         <input
//                           type="file"
//                           multiple
//                           onChange={(e) =>
//                             setCommentAttachedFiles(
//                               Array.from(e.target.files || [])
//                             )
//                           }
//                           className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neokred-primary/10 file:text-neokred-primary hover:file:bg-neokred-primary/20 cursor-pointer"
//                         />
//                         {commentAttachedFiles.length > 0 && (
//                           <div className="mt-2 space-y-1">
//                             {commentAttachedFiles.map((file, index) => (
//                               <div
//                                 key={index}
//                                 className="flex items-center text-xs text-gray-600 bg-gray-100 p-1 rounded"
//                               >
//                                 <Paperclip
//                                   size={12}
//                                   className="mr-2 flex-shrink-0"
//                                 />
//                                 <span className="truncate">{file.name}</span>
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                       <div className="flex justify-end gap-2">
//                         <button
//                           onClick={() => setIsAddingComment(false)}
//                           className="px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300"
//                         >
//                           Cancel
//                         </button>
//                         <button
//                           onClick={handleAddComment}
//                           className="px-4 py-2 bg-neokred-primary text-white text-sm rounded-md hover:bg-neokred-primary-dark"
//                         >
//                           Add Comment
//                         </button>
//                       </div>
//                     </div>
//                   ) : (
//                     <button
//                       onClick={() => setIsAddingComment(true)}
//                       className="w-full px-4 py-2 bg-neokred-primary text-white text-sm rounded-md hover:bg-neokred-primary-dark"
//                     >
//                       Add Comment
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </Modal>
//   );
// };

const TicketDetailModal: React.FC<{
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  setViewingImage: (url: string) => void;
  onUpdateTicket: (updatedTicket: Ticket) => void;
}> = ({ ticket, isOpen, onClose, setViewingImage, onUpdateTicket }) => {
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentAttachedFiles, setCommentAttachedFiles] = useState<File[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | null>(
    null
  );
  const [users, setUsers] = useState<User[]>([]); // ✅ State for real users
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // ✅ Fetch users from API when modal opens
  useEffect(() => {
    const fetchUsers = async () => {
      if (isOpen) {
        try {
          setIsLoadingUsers(true);
          const usersData = await apiService.getUsers();
          setUsers(Array.isArray(usersData) ? usersData : ([] as any));
        } catch (error) {
          console.error("Failed to load users:", error);
          addToast("Failed to load users", "error");
          setUsers([]); // Fallback to empty array
        } finally {
          setIsLoadingUsers(false);
        }
      }
    };

    fetchUsers();
  }, [isOpen, addToast]);

  useEffect(() => {
    if (ticket) {
      setSelectedAssignee(ticket.assignedTo?.id || ""); // ✅ Set ID or empty string
      setSelectedStatus(ticket.status);
      setCommentText("");
      setCommentAttachedFiles([]);
      setIsAddingComment(false);
    }
  }, [ticket]);

  if (!ticket) return null;

  // ✅ Use real users from database instead of mockUsers
  const internalUsers = users.filter((u) => u.role !== "Merchant");
  const canPerformActions = currentUser && currentUser.role !== "Merchant";

  const handleAssignToMe = () => {
    if (!currentUser?.id) {
      addToast("Unable to assign ticket: User not found", "error");
      return;
    }

    const updateData = {
      assignedTo: currentUser.id, // ✅ Send only the ID
    };

    console.log("🔄 Assigning to me:", currentUser.id);
    onUpdateTicket({
      ...ticket,
      ...updateData,
      updatedAt: new Date().toLocaleString("en-GB"),
    });
    addToast(`Ticket ${ticket.id} assigned to you.`, "success");
  };

  const handleUpdateAssignment = () => {
    console.log("🔄 Selected assignee:", selectedAssignee);

    // Handle unassignment (when "Unassigned" is selected)
    if (selectedAssignee === "" || selectedAssignee === null) {
      const updateData = {
        assignedTo: null, // Send null to unassign
      };

      console.log("🔄 Unassigning ticket");
      onUpdateTicket({
        ...ticket,
        ...updateData,
        updatedAt: new Date().toLocaleString("en-GB"),
      });
      addToast(`Ticket ${ticket.id} has been unassigned.`, "success");
      return;
    }

    // ✅ Handle assignment - find user in real users array
    const assignedUser = users.find((u) => u.id === selectedAssignee);

    if (!assignedUser) {
      addToast("Selected user not found", "error");
      return;
    }

    const updateData = {
      assignedTo: assignedUser.id, // ✅ Send only the ID string
    };

    console.log("🔄 Assigning to user ID:", assignedUser.id);
    onUpdateTicket({
      ...ticket,
      ...updateData,
      updatedAt: new Date().toLocaleString("en-GB"),
    });
    addToast(
      `Ticket ${ticket.id} assigned to ${assignedUser.name}.`,
      "success"
    );
  };

  const handleUpdateStatus = () => {
    if (!selectedStatus) return;
    const updatedTicket = {
      ...ticket,
      status: selectedStatus,
      updatedAt: new Date().toLocaleString("en-GB"),
    };
    onUpdateTicket(updatedTicket);
    addToast(
      `Ticket ${ticket.id} status updated to "${selectedStatus}".`,
      "success"
    );
  };

  const handleAddComment = () => {
    if (
      (!commentText.trim() && commentAttachedFiles.length === 0) ||
      !currentUser
    )
      return;

    const newAttachments: Attachment[] = commentAttachedFiles.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)}KB`,
      type: f.type.startsWith("image/") ? "image" : "file",
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));

    const newComment: Comment = {
      id: `c${Date.now()}`,
      user: currentUser,
      content: commentText.trim(),
      timestamp: new Date().toLocaleString("en-GB"),
      isSystem: false,
      attachments: newAttachments.length > 0 ? newAttachments : undefined,
    };
    const updatedTicket = {
      ...ticket,
      comments: [...ticket.comments, newComment],
      updatedAt: new Date().toLocaleString("en-GB"),
    };
    onUpdateTicket(updatedTicket);
    addToast(`Comment added to Ticket ${ticket.id}.`, "success");
    setCommentText("");
    setCommentAttachedFiles([]);
    setIsAddingComment(false);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("");

  const handleAttachmentClick = (att: Attachment) => {
    if (att.type === "image" && att.url) {
      setViewingImage(att.url);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${ticket.id} - ${ticket.title}`}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge colorClasses={STATUS_COLORS[ticket.status]}>
                {ticket.status}
              </Badge>
              <Badge colorClasses={PRIORITY_BADGE_COLORS[ticket.priority]}>
                {ticket.priority}
              </Badge>
            </div>
            <h4 className="font-semibold text-gray-800">Description</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-2">Details</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <strong className="text-gray-500">Created by:</strong>
              <span className="text-gray-700">
                {getUserName(ticket.createdBy)}
              </span>
              <strong className="text-gray-500">Assigned to:</strong>
              <span className="text-gray-700">
                {getUserName(ticket.assignedTo)}
              </span>
              <strong className="text-gray-500">Created:</strong>
              <span className="text-gray-700">{ticket.createdAt}</span>
              <strong className="text-gray-500">Last updated:</strong>
              <span className="text-gray-700">{ticket.updatedAt}</span>
              <strong className="text-gray-500">SLA Deadline:</strong>
              <span className="text-gray-700">{ticket.slaDeadline}</span>
            </div>
          </div>

          {ticket.products.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Related Products
              </h4>
              <div className="flex flex-wrap gap-2">
                {ticket.products.map((p) => (
                  <span
                    key={p.id}
                    className="px-2 py-1 text-xs rounded-md"
                    style={{ backgroundColor: `${p.color}20`, color: p.color }}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ticket.attachments.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Attachments</h4>
              {ticket.attachments.map((att) => (
                <button
                  key={att.name}
                  onClick={() => handleAttachmentClick(att)}
                  disabled={att.type !== "image"}
                  className="w-full flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md disabled:cursor-not-allowed hover:bg-gray-100 disabled:hover:bg-gray-50"
                >
                  {att.type === "image" ? (
                    <ImageIcon size={18} className="text-green-600" />
                  ) : (
                    <FileIcon size={18} className="text-gray-500" />
                  )}
                  <span>{att.name}</span>
                  <span className="text-gray-400">({att.size})</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-4">
              Comments & Updates
            </h4>
            <div className="space-y-4">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg ${
                    comment.isSystem ? "bg-blue-50" : "bg-white border"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          comment.isSystem
                            ? "bg-gray-400 text-white"
                            : "bg-neokred-primary text-white"
                        }`}
                      >
                        {getInitials(comment.user.name)}
                      </div>
                      <span className="font-semibold text-gray-800">
                        {comment.user.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {comment.timestamp}
                    </span>
                  </div>
                  {comment.content && (
                    <p className="text-sm text-gray-600 pl-10 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="pl-10 mt-3 space-y-2">
                      {comment.attachments.map((att) => (
                        <button
                          key={att.name}
                          onClick={() => handleAttachmentClick(att)}
                          disabled={att.type !== "image"}
                          className="w-full flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md disabled:cursor-not-allowed hover:bg-gray-100 disabled:hover:bg-gray-50 text-left"
                        >
                          {att.type === "image" ? (
                            <ImageIcon size={18} className="text-green-600" />
                          ) : (
                            <FileIcon size={18} className="text-gray-500" />
                          )}
                          <span>{att.name}</span>
                          <span className="text-gray-400">({att.size})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {canPerformActions && (
          <div className="w-full lg:w-1/3 lg:border-l lg:pl-6">
            <div className="sticky top-0">
              <h4 className="font-semibold text-gray-800 mb-4">Actions</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Assignment
                  </label>
                  <div className="mt-1 space-y-2">
                    <button
                      onClick={handleAssignToMe}
                      className="w-full px-4 py-2 bg-neokred-primary text-white text-sm rounded-md hover:bg-neokred-primary-dark"
                    >
                      Assign to Me
                    </button>

                    {/* ✅ Users dropdown with real data */}
                    {isLoadingUsers ? (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500">
                          Loading users...
                        </p>
                      </div>
                    ) : (
                      <>
                        <select
                          value={selectedAssignee || ""}
                          onChange={(e) => setSelectedAssignee(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary text-sm"
                        >
                          <option value="">Unassigned</option>
                          {internalUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                        </select>

                        {internalUsers.length === 0 && !isLoadingUsers && (
                          <p className="text-xs text-gray-500 text-center">
                            No users available
                          </p>
                        )}
                      </>
                    )}

                    <button
                      onClick={handleUpdateAssignment}
                      disabled={isLoadingUsers}
                      className="w-full px-4 py-2 bg-neokred-primary text-white text-sm rounded-md hover:bg-neokred-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isLoadingUsers ? "Loading..." : "Update Assignment"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1 space-y-2">
                    <select
                      value={selectedStatus || ""}
                      onChange={(e) =>
                        setSelectedStatus(e.target.value as TicketStatus)
                      }
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary text-sm"
                    >
                      {Object.values(TicketStatus).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleUpdateStatus}
                      className="w-full px-4 py-2 bg-neokred-primary text-white text-sm rounded-md hover:bg-neokred-primary-dark"
                    >
                      Update Status
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  {isAddingComment ? (
                    <div className="space-y-2">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={4}
                        placeholder="Enter your comment..."
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-neokred-primary focus:border-neokred-primary text-sm"
                      ></textarea>
                      <div>
                        <input
                          type="file"
                          multiple
                          onChange={(e) =>
                            setCommentAttachedFiles(
                              Array.from(e.target.files || [])
                            )
                          }
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neokred-primary/10 file:text-neokred-primary hover:file:bg-neokred-primary/20 cursor-pointer"
                        />
                        {commentAttachedFiles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {commentAttachedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center text-xs text-gray-600 bg-gray-100 p-1 rounded"
                              >
                                <Paperclip
                                  size={12}
                                  className="mr-2 flex-shrink-0"
                                />
                                <span className="truncate">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsAddingComment(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddComment}
                          className="px-4 py-2 bg-neokred-primary text-white text-sm rounded-md hover:bg-neokred-primary-dark"
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingComment(true)}
                      className="w-full px-4 py-2 bg-neokred-primary text-white text-sm rounded-md hover:bg-neokred-primary-dark"
                    >
                      Add Comment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// const EscalationRulesModal: React.FC<{
//   isOpen: boolean;
//   onClose: () => void;
//   rules: EscalationRule[];
//   setRules: (rules: EscalationRule[]) => void;
// }> = ({ isOpen, onClose, rules, setRules }) => {
//   const { addToast } = useToast();
//   const [priority, setPriority] = useState(TicketPriority.High);
//   const [timeInHours, setTimeInHours] = useState(24);
//   const [escalateToRole, setEscalateToRole] =
//     useState<UserRole>("Technical Lead");

//   const handleAddRule = () => {
//     const newRule: EscalationRule = {
//       id: `rule-${Date.now()}`,
//       priority,
//       timeInHours,
//       escalateToRole,
//     };
//     setRules([...rules, newRule]);
//     addToast("Escalation rule added.", "success");
//   };

//   const handleRemoveRule = (ruleId: string) => {
//     setRules(rules.filter((rule) => rule.id !== ruleId));
//     addToast("Escalation rule removed.", "info");
//   };

//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title="Manage Escalation Rules">
//       <div className="space-y-6">
//         <div>
//           <h4 className="font-semibold text-gray-800 mb-2">Create New Rule</h4>
//           <div className="p-4 border rounded-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
//             <div>
//               <label className="text-sm font-medium text-gray-700">
//                 Priority
//               </label>
//               <select
//                 value={priority}
//                 onChange={(e) => setPriority(e.target.value as TicketPriority)}
//                 className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 bg-white"
//               >
//                 {Object.values(TicketPriority).map((p) => (
//                   <option key={p} value={p}>
//                     {p}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className="text-sm font-medium text-gray-700">
//                 Time (hours)
//               </label>
//               <input
//                 type="number"
//                 value={timeInHours}
//                 onChange={(e) => setTimeInHours(parseInt(e.target.value, 10))}
//                 className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3"
//               />
//             </div>
//             <div>
//               <label className="text-sm font-medium text-gray-700">
//                 Escalate To
//               </label>
//               <select
//                 value={escalateToRole}
//                 onChange={(e) => setEscalateToRole(e.target.value as UserRole)}
//                 className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 bg-white"
//               >
//                 {["Technical Lead", "Support Manager", "Admin"].map((r) => (
//                   <option key={r} value={r}>
//                     {r}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <button
//               onClick={handleAddRule}
//               className="px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark"
//             >
//               Add Rule
//             </button>
//           </div>
//         </div>
//         <div>
//           <h4 className="font-semibold text-gray-800 mb-2">Active Rules</h4>
//           <div className="space-y-2">
//             {rules.length > 0 ? (
//               rules.map((rule) => (
//                 <div
//                   key={rule.id}
//                   className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
//                 >
//                   <p className="text-sm text-gray-700">
//                     Escalate{" "}
//                     <span className="font-semibold">{rule.priority}</span>{" "}
//                     tickets to{" "}
//                     <span className="font-semibold">{rule.escalateToRole}</span>{" "}
//                     after{" "}
//                     <span className="font-semibold">{rule.timeInHours}</span>{" "}
//                     hours of no activity.
//                   </p>
//                   <button
//                     onClick={() => handleRemoveRule(rule.id)}
//                     className="text-red-500 hover:text-red-700"
//                   >
//                     <Trash2 size={16} />
//                   </button>
//                 </div>
//               ))
//             ) : (
//               <p className="text-sm text-gray-500 text-center py-4">
//                 No escalation rules defined.
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//     </Modal>
//   );
// };

const EscalationRulesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  rules: EscalationRule[];
  setRules: (rules: EscalationRule[]) => void;
}> = ({ isOpen, onClose, rules, setRules }) => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [priority, setPriority] = useState(TicketPriority.High);
  const [timeInHours, setTimeInHours] = useState(24);
  const [escalateToRole, setEscalateToRole] =
    useState<UserRole>("Technical Lead");
  const [isLoading, setIsLoading] = useState(false);

  // Load rules when modal opens
  useEffect(() => {
    if (isOpen) {
      loadEscalationRules();
    }
  }, [isOpen]);

  const loadEscalationRules = async () => {
    try {
      setIsLoading(true);
      const escalationRulesData = await apiService.getEscalationRules();
      setRules(Array.isArray(escalationRulesData) ? escalationRulesData : []);
    } catch (error) {
      console.error("Error loading escalation rules:", error);
      addToast("Failed to load escalation rules", "error");
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRule = async () => {
    const newRule: EscalationRule = {
      id: `rule-${Date.now()}`,
      priority,
      timeInHours,
      escalateToRole,
    };

    const updatedRules = [...rules, newRule];

    try {
      setIsLoading(true);
      const savedRules = await apiService.setEscalationRules(updatedRules);
      setRules(savedRules);

      // Add audit log for rule creation
      await auditLogService.logAction(
        AuditLogAction.ESCALATION_RULE_CREATED,
        `Created escalation rule for ${priority} priority tickets to ${escalateToRole} after ${timeInHours} hours`,
        {
          ruleId: newRule.id,
          priority: priority,
          escalateToRole: escalateToRole,
          timeInHours: timeInHours,
          totalRules: updatedRules.length,
        }
      );

      addToast("Escalation rule added.", "success");
    } catch (error) {
      console.error("Error adding escalation rule:", error);
      addToast("Failed to add escalation rule", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRule = async (ruleId: string) => {
    // Find the rule being removed for audit log
    const ruleToRemove = rules.find((rule) => rule.id === ruleId);

    const updatedRules = rules.filter((rule) => rule.id !== ruleId);

    try {
      setIsLoading(true);
      const savedRules = await apiService.setEscalationRules(updatedRules);
      setRules(savedRules);

      // Add audit log for rule removal
      if (ruleToRemove) {
        await auditLogService.logAction(
          AuditLogAction.ESCALATION_RULE_DELETED,
          `Removed escalation rule for ${ruleToRemove.priority} priority tickets to ${ruleToRemove.escalateToRole} after ${ruleToRemove.timeInHours} hours`,
          {
            ruleId: ruleId,
            priority: ruleToRemove.priority,
            escalateToRole: ruleToRemove.escalateToRole,
            timeInHours: ruleToRemove.timeInHours,
            totalRules: updatedRules.length,
          }
        );
      }

      addToast("Escalation rule removed.", "info");
    } catch (error) {
      console.error("Error removing escalation rule:", error);
      addToast("Failed to remove escalation rule", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const checkRulesExistence = async () => {
    try {
      const rulesExist = await apiService.checkEscalationRules();

      // Add audit log for rules check
      await auditLogService.logAction(
        AuditLogAction.ESCALATION_RULES_CHECKED,
        `Checked escalation rules status - ${
          rulesExist ? "Rules exist" : "No rules defined"
        }`,
        {
          rulesExist: rulesExist,
          totalRules: rules.length,
          checkedBy: user?.name || "Unknown",
        }
      );

      if (rulesExist) {
        addToast("Escalation rules are configured", "success");
      } else {
        addToast("No escalation rules defined yet", "info");
      }
    } catch (error) {
      console.error("Error checking rules existence:", error);

      // Add audit log for failed check
      await auditLogService.logAction(
        AuditLogAction.ESCALATION_RULES_CHECKED,
        "Failed to check escalation rules status",
        {
          rulesExist: false,
          error: error instanceof Error ? error.message : "Unknown error",
          checkedBy: user?.name || "Unknown",
        }
      );

      addToast("Failed to check rules status", "error");
    }
  };

  const handleSaveAllRules = async () => {
    if (rules.length === 0) {
      addToast("No rules to save", "error");
      return;
    }

    try {
      setIsLoading(true);
      const savedRules = await apiService.setEscalationRules(rules);
      setRules(savedRules);

      // Add audit log for bulk rules save
      await auditLogService.logAction(
        AuditLogAction.ESCALATION_RULES_UPDATED,
        `Updated all escalation rules (${rules.length} rules)`,
        {
          totalRules: rules.length,
          rules: rules.map((rule) => ({
            id: rule.id,
            priority: rule.priority,
            escalateToRole: rule.escalateToRole,
            timeInHours: rule.timeInHours,
          })),
        }
      );

      addToast("All escalation rules saved successfully", "success");
    } catch (error) {
      console.error("Error saving escalation rules:", error);

      // Add audit log for failed save
      await auditLogService.logAction(
        AuditLogAction.ESCALATION_RULES_UPDATED,
        "Failed to save escalation rules",
        {
          totalRules: rules.length,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      );

      addToast("Failed to save escalation rules", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Escalation Rules">
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Create New Rule</h4>
          <div className="p-4 border rounded-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 bg-white"
              >
                {Object.values(TicketPriority).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Time (hours)
              </label>
              <input
                type="number"
                value={timeInHours}
                onChange={(e) => setTimeInHours(parseInt(e.target.value, 10))}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Escalate To
              </label>
              <select
                value={escalateToRole}
                onChange={(e) => setEscalateToRole(e.target.value as UserRole)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 bg-white"
              >
                {["Technical Lead", "Support Manager", "Admin"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddRule}
              disabled={isLoading}
              className="px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Adding..." : "Add Rule"}
            </button>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-800">Active Rules</h4>
            <div className="flex gap-2">
              <button
                onClick={checkRulesExistence}
                disabled={isLoading}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Check Rules
              </button>
              <button
                onClick={handleSaveAllRules}
                disabled={isLoading || rules.length === 0}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save All Rules
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Loading rules...
              </p>
            ) : rules.length > 0 ? (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <p className="text-sm text-gray-700">
                    Escalate{" "}
                    <span className="font-semibold">{rule.priority}</span>{" "}
                    tickets to{" "}
                    <span className="font-semibold">{rule.escalateToRole}</span>{" "}
                    after{" "}
                    <span className="font-semibold">{rule.timeInHours}</span>{" "}
                    hours of no activity.
                  </p>
                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    disabled={isLoading}
                    className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No escalation rules defined.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEscalationModalOpen, setEscalationModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch data from API
  // useEffect(() => {
  //   loadData();
  // }, []);

  // const loadData = async () => {
  //   try {
  //     setIsLoading(true);
  //     const [ticketsData, productsData, usersData] = await Promise.all([
  //       apiService.getTickets(),
  //       apiService.getProducts(),
  //       apiService.getUsers(),
  //     ]);
  //     console.log(productsData, "---productsData");

  //     // Normalize all data
  //     setTickets(
  //       Array.isArray(ticketsData) ? ticketsData.map(normalizeTicket) : []
  //     );
  //     setProducts(Array.isArray(productsData) ? productsData : []);
  //     //@ts-ignore
  //     setUsers(Array.isArray(usersData) ? usersData : []);
  //   } catch (error) {
  //     addToast("Failed to load data", "error");
  //     console.error("Error loading data:", error);
  //     // Set empty arrays as fallback
  //     setTickets([]);
  //     setProducts([]);
  //     setUsers([]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ticketsData, productsData, usersData, escalationRulesData] =
        await Promise.all([
          apiService.getTickets(),
          apiService.getProducts(),
          apiService.getUsers(),
          apiService.getEscalationRules(), // ✅ Load escalation rules
        ]);

      // Normalize all data
      setTickets(
        Array.isArray(ticketsData) ? ticketsData.map(normalizeTicket) : []
      );
      setProducts(Array.isArray(productsData) ? productsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setEscalationRules(
        Array.isArray(escalationRulesData) ? escalationRulesData : []
      ); // ✅ Set escalation rules
    } catch (error) {
      addToast("Failed to load data", "error");
      console.error("Error loading data:", error);
      // Set empty arrays as fallback
      setTickets([]);
      setProducts([]);
      setUsers([]);
      setEscalationRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailModalOpen(true);
  };

  const handleTicketCreated = async (newTicket: Ticket) => {
    try {
      console.log(newTicket, "----newTicket");
      const createdTicket = await apiService.createTicket(newTicket);
      setTickets((prevTickets: any) => [createdTicket, ...prevTickets]);
      // Audit log
      await auditLogService.logAction(
        AuditLogAction.TICKET_CREATED,
        `Created ticket: ${newTicket.title} (${newTicket.id})`,
        { ticketId: newTicket.id, title: newTicket.title }
      );
      addToast("Ticket created successfully!", "success");
    } catch (error) {
      addToast("Failed to create ticket", "error");
      console.error("Error creating ticket:", error);
    }
  };

  const handleUpdateTicket = async (updatedTicket: Ticket) => {
    try {
      const updates = await apiService.updateTicket(
        updatedTicket.id,
        updatedTicket
      );
      console.log(updates, "[-----resultresultresult");
      setTickets((prevTickets: any) =>
        prevTickets.map((t) => (t.id === updatedTicket.id ? updates : t))
      );
      //@ts-ignore

      setSelectedTicket(updates);
      if (updates.status) {
        await auditLogService.logAction(
          AuditLogAction.TICKET_STATUS_UPDATE,
          `Changed ticket ${updatedTicket.id} status to ${updates.status}`,
          {
            ticketId: updatedTicket.id,
            previousStatus: tickets.find((t) => t.id === updatedTicket.id)
              ?.status,
            newStatus: updates.status,
          }
        );
      }

      // Audit log for priority changes
      if (updates.priority) {
        await auditLogService.logAction(
          AuditLogAction.TICKET_PRIORITY_UPDATE,
          `Changed ticket ${updatedTicket.id} priority to ${updates.priority}`,
          {
            ticketId: updatedTicket.id,
            previousPriority: tickets.find((t) => t.id === updatedTicket.id)
              ?.priority,
            newPriority: updates.priority,
          }
        );
      }

      // Audit log for assignment changes
      if (updates.assignedTo) {
        await auditLogService.logAction(
          AuditLogAction.TICKET_ASSIGNMENT,
          `Assigned ticket ${updatedTicket.id} to ${getUserName(
            updates.assignedTo
          )}`,
          { ticketId: updatedTicket.id, assignedTo: updates.assignedTo }
        );
      }
    } catch (error) {
      console.log(error, "----error");
      addToast("Failed to update ticket 1", "error");
      console.error("Error updating ticket:", error);
    }
  };

  // const handleCheckEscalations = async () => {
  //   if (escalationRules.length === 0) {
  //     addToast("No escalation rules defined.", "info");
  //     return;
  //   }

  //   let escalatedCount = 0;
  //   const now = new Date();

  //   // Fetch latest users (ensures up-to-date role info)
  //   let currentUsers: User[] = [];
  //   try {
  //     currentUsers = await apiService.getUsers();
  //   } catch (err) {
  //     addToast("Failed to fetch users for escalation.", "error");
  //     return;
  //   }

  //   const updatedTickets = await Promise.all(
  //     tickets.map(async (ticket) => {
  //       const applicableRule = escalationRules.find(
  //         (rule) => rule.priority === ticket.priority
  //       );

  //       // Skip if no matching rule or already escalated
  //       if (!applicableRule || ticket.status === TicketStatus.Escalated) {
  //         return ticket;
  //       }

  //       const lastUpdated = parseTicketDate(ticket.updatedAt);
  //       const hoursSinceUpdate =
  //         (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

  //       // If ticket exceeded escalation time
  //       if (hoursSinceUpdate > applicableRule.timeInHours) {
  //         // Find user with that role
  //         const targetUser = currentUsers.find(
  //           (u) => u.role === applicableRule.escalateToRole
  //         );

  //         if (targetUser) {
  //           escalatedCount++;

  //           const updatedTicket: Ticket = {
  //             ...ticket,
  //             status: TicketStatus.Escalated,
  //             assignedTo: targetUser,
  //             updatedAt: new Date().toLocaleString("en-GB"),
  //           };

  //           try {
  //             const result = await apiService.updateTicket(
  //               ticket.id,
  //               updatedTicket
  //             );
  //             await auditLogService.logAction(
  //               AuditLogAction.TICKET_ESCALATED,
  //               `Ticket ${ticket.id} auto-escalated to ${targetUser.name} (${targetUser.role}).`,
  //               {
  //                 ticketId: ticket.id,
  //                 assignedTo: targetUser.id,
  //                 escalateToRole: applicableRule.escalateToRole,
  //               }
  //             );

  //             return result;
  //           } catch (error) {
  //             console.error("Failed to update ticket:", error);
  //             return ticket;
  //           }
  //         }
  //       }

  //       return ticket;
  //     })
  //   );

  //   if (escalatedCount > 0) {
  //     setTickets(updatedTickets);
  //     addToast(`${escalatedCount} ticket(s) were escalated.`, "success");
  //   } else {
  //     addToast("No tickets met the criteria for escalation.", "info");
  //   }
  // };
  const handleCheckEscalations = async () => {
    // First check if we have escalation rules
    if (escalationRules.length === 0) {
      addToast("No escalation rules defined.", "info");
      return;
    }

    try {
      // Use the backend API to check and perform escalations
      const result = await apiService.checkAndPerformEscalations();

      // Add audit log for escalation check
      await auditLogService.logAction(
        AuditLogAction.ESCALATION_CHECK_PERFORMED,
        `Performed escalation check: ${result.message}`,
        {
          escalatedCount: result.escalatedCount,
          totalTickets: tickets.length,
          escalationRulesCount: escalationRules.length,
        }
      );

      if (result.escalatedCount > 0) {
        // Reload tickets to get updated data from backend
        const updatedTickets = await apiService.getTickets();
        setTickets(
          Array.isArray(updatedTickets)
            ? updatedTickets.map(normalizeTicket)
            : []
        );

        addToast(
          `${result.escalatedCount} ticket(s) were escalated.`,
          "success"
        );
      } else {
        addToast("No tickets met the criteria for escalation.", "info");
      }
    } catch (error) {
      console.error("Error performing escalations:", error);

      // Add audit log for failed escalation check
      await auditLogService.logAction(
        AuditLogAction.ESCALATION_CHECK_PERFORMED,
        "Failed to perform escalation check",
        {
          error: error instanceof Error ? error.message : "Unknown error",
          totalTickets: tickets.length,
          escalationRulesCount: escalationRules.length,
        }
      );

      addToast("Failed to perform escalation check", "error");

      // Fallback to frontend escalation logic if backend fails
      await performFrontendEscalation();
    }
  };

  // Fallback function for frontend escalation logic
  const performFrontendEscalation = async () => {
    let escalatedCount = 0;
    const now = new Date();

    // Fetch latest users (ensures up-to-date role info)
    let currentUsers: User[] = [];
    try {
      currentUsers = await apiService.getUsers();
    } catch (err) {
      addToast("Failed to fetch users for escalation.", "error");
      return;
    }

    const updatedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const applicableRule = escalationRules.find(
          (rule) => rule.priority === ticket.priority
        );

        // Skip if no matching rule or already escalated
        if (!applicableRule || ticket.status === TicketStatus.Escalated) {
          return ticket;
        }

        const lastUpdated = parseTicketDate(ticket.updatedAt);
        const hoursSinceUpdate =
          (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

        // If ticket exceeded escalation time
        if (hoursSinceUpdate > applicableRule.timeInHours) {
          // Find user with that role
          const targetUser = currentUsers.find(
            (u) => u.role === applicableRule.escalateToRole
          );

          if (targetUser) {
            escalatedCount++;

            const updatedTicket: Ticket = {
              ...ticket,
              status: TicketStatus.Escalated,
              assignedTo: targetUser,
              updatedAt: new Date().toLocaleString("en-GB"),
            };

            try {
              const result = await apiService.updateTicket(
                ticket.id,
                updatedTicket
              );
              await auditLogService.logAction(
                AuditLogAction.TICKET_ESCALATED,
                `Ticket ${ticket.id} auto-escalated to ${targetUser.name} (${targetUser.role}).`,
                {
                  ticketId: ticket.id,
                  assignedTo: targetUser.id,
                  escalateToRole: applicableRule.escalateToRole,
                }
              );

              return result;
            } catch (error) {
              console.error("Failed to update ticket:", error);
              return ticket;
            }
          }
        }

        return ticket;
      })
    );

    if (escalatedCount > 0) {
      setTickets(updatedTickets);
      addToast(
        `${escalatedCount} ticket(s) were escalated (frontend fallback).`,
        "success"
      );
    } else {
      addToast("No tickets met the criteria for escalation.", "info");
    }
  };
  const exportToCsv = (data: Ticket[], filename: string) => {
    const headers = [
      "ID",
      "Title",
      "Status",
      "Priority",
      "Created By",
      "Assigned To",
      "Created At",
      "Last Updated",
    ];
    const rows = data.map((ticket) =>
      [
        ticket.id,
        `"${ticket.title}"`,
        ticket.status,
        ticket.priority,
        getUserName(ticket.createdBy),
        getUserName(ticket.assignedTo),
        ticket.createdAt,
        ticket.updatedAt,
      ].join(",")
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        searchTerm === "" ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getUserName(ticket.createdBy)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        getUserName(ticket.assignedTo)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || ticket.priority === priorityFilter;
      const matchesAssignee = !showUnassignedOnly || !ticket.assignedTo;
      const matchesProduct =
        productFilter === "All" ||
        ticket.products.some((p) => p.id === productFilter);

      const ticketDate = parseTicketDate(ticket.createdAt).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate
        ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1)
        : Infinity;
      const matchesDate = ticketDate >= start && ticketDate <= end;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesAssignee &&
        matchesProduct &&
        matchesDate
      );
    });
  }, [
    tickets,
    searchTerm,
    statusFilter,
    priorityFilter,
    showUnassignedOnly,
    productFilter,
    startDate,
    endDate,
  ]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <ImageViewerModal
        isOpen={!!viewingImage}
        src={viewingImage}
        onClose={() => setViewingImage(null)}
      />
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        products={products}
        onTicketCreated={handleTicketCreated}
      />
      <TicketDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        ticket={selectedTicket}
        setViewingImage={setViewingImage}
        onUpdateTicket={handleUpdateTicket}
      />
      {(user?.role === "Admin" || user?.role === "Support Manager") && (
        <EscalationRulesModal
          isOpen={isEscalationModalOpen}
          onClose={() => setEscalationModalOpen(false)}
          rules={escalationRules}
          setRules={setEscalationRules}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Ticket Management
          </h2>
          <p className="text-sm text-gray-500">
            View, manage, and track all support tickets.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-neokred-primary text-white rounded-md hover:bg-neokred-primary-dark"
          >
            <Plus size={16} /> Create New Ticket
          </button>
          <button
            onClick={() => exportToCsv(filteredTickets, "tickets.csv")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4 border rounded-md mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neokred-primary/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none"
          >
            <option value="All">All Statuses</option>
            {Object.values(TicketStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none"
          >
            <option value="All">All Priorities</option>
            {Object.values(TicketPriority).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none"
          >
            <option value="All">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="unassigned-tickets"
              checked={showUnassignedOnly}
              onChange={(e) => setShowUnassignedOnly(e.target.checked)}
              className="h-4 w-4 text-neokred-primary border-gray-300 rounded focus:ring-neokred-primary"
            />
            <label
              htmlFor="unassigned-tickets"
              className="ml-2 block text-sm text-gray-700"
            >
              Show unassigned only
            </label>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <label>From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md p-1.5 text-sm"
            />
            <label>To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md p-1.5 text-sm"
            />
          </div>
        </div>
        {(user?.role === "Admin" || user?.role === "Support Manager") && (
          <div className="flex justify-end gap-2 pt-2 border-t mt-2">
            <button
              onClick={() => setEscalationModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border"
            >
              <Settings size={14} /> Escalation Rules
            </button>
            <button
              onClick={handleCheckEscalations}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 border border-orange-200"
            >
              <AlertTriangle size={14} /> Check Escalations
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Ticket
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Priority
              </th>
              <th scope="col" className="px-6 py-3">
                Created by
              </th>
              <th scope="col" className="px-6 py-3">
                Assigned to
              </th>
              <th scope="col" className="px-6 py-3">
                Last Updated
              </th>
              <th scope="col" className="px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="bg-white border-b hover:bg-gray-50"
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  <p className="font-semibold flex items-center gap-2">
                    <span>
                      {ticket.id} - {ticket.title}
                    </span>
                    {ticket.attachments.length > 0 && (
                      <Paperclip size={14} className="text-gray-500" />
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ticket.products.map((p) => p.name).join(", ")}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <Badge colorClasses={STATUS_COLORS[ticket.status]}>
                    {ticket.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge colorClasses={PRIORITY_BADGE_COLORS[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                </td>
                <td className="px-6 py-4">{getUserName(ticket.createdBy)}</td>
                <td className="px-6 py-4">{getUserName(ticket.assignedTo)}</td>
                <td className="px-6 py-4">{ticket.updatedAt}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewTicket(ticket)}
                    className="px-3 py-1 text-xs font-medium text-white bg-neokred-primary rounded-md hover:bg-neokred-primary-dark"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredTickets.length === 0 && (
              <tr className="bg-white border-b">
                <td colSpan={7} className="text-center py-10 text-gray-500">
                  <p>No tickets found for the selected filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketsPage;
