import React, { useState } from 'react';
import { format } from 'date-fns';
import { Send, Plus, Trash2, Edit3, MoreVertical, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Devlog = ({ projectId, updates, isAuthor, onUpdate }) => {
    const [isPosting, setIsPosting] = useState(false);
    const [newUpdate, setNewUpdate] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(false);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!newUpdate.title || !newUpdate.content) return;

        setLoading(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/projects/${projectId}/updates`, newUpdate);
            onUpdate(res.data); // Parent should update state
            setNewUpdate({ title: '', content: '' });
            setIsPosting(false);
            toast.success("Devlog updated successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to post update.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                    Development_Log
                </h2>
                {isAuthor && (
                    <button
                        onClick={() => setIsPosting(!isPosting)}
                        className="px-4 py-2 bg-neon-green text-black font-black uppercase text-xs tracking-widest rounded hover:bg-white transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New_Entry
                    </button>
                )}
            </div>

            {isPosting && (
                <div className="bg-terminal border border-gray-900 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-neon-green font-mono text-xs uppercase tracking-widest mb-4">New Transmission</h3>
                    <form onSubmit={handlePost} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Update Title (e.g. v1.2 Patch Notes)"
                            className="w-full bg-void border border-gray-800 rounded-lg p-3 text-white focus:border-neon-green outline-none font-bold"
                            value={newUpdate.title}
                            onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                        />
                        <textarea
                            placeholder="Describe the changes, fixes, or future plans..."
                            className="w-full h-32 bg-void border border-gray-800 rounded-lg p-3 text-white focus:border-neon-green outline-none resize-none font-mono text-sm"
                            value={newUpdate.content}
                            onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPosting(false)}
                                className="px-4 py-2 text-gray-500 hover:text-white text-xs font-bold uppercase transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-neon-blue text-black font-black uppercase text-xs tracking-widest rounded hover:bg-white transition-all flex items-center gap-2"
                            >
                                {loading ? 'Transmitting...' : <><Send className="w-3 h-3" /> Publish</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-6">
                {updates && updates.length > 0 ? (
                    updates.map((update, index) => (
                        <div key={index} className="bg-terminal border border-gray-900 rounded-xl p-6 relative group hover:border-gray-700 transition-all">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-neon-green to-transparent rounded-l-xl opacity-50 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{update.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="w-3 h-3 text-gray-500" />
                                        <p className="text-xs text-gray-500 font-mono">
                                            {update.createdAt ? new Date(update.createdAt).toLocaleDateString() : 'Unknown Date'}
                                        </p>
                                    </div>
                                </div>
                                {/* Future: Add edit/delete for author */}
                            </div>

                            <div className="prose prose-invert prose-sm max-w-none text-gray-300 font-mono">
                                <p className="whitespace-pre-wrap">{update.content}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
                        <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">No signals detected on this frequency.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Devlog;
