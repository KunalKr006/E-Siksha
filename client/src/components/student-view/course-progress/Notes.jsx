import React, { useState, useEffect } from "react";
import { FaStickyNote, FaSave, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  getNotesService,
  saveNotesService,
  deleteNotesService,
} from "../../../services";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Notes = ({ userId, courseId, lectureId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && userId && courseId && lectureId) {
      console.log("Fetching notes for:", { userId, courseId, lectureId });
      fetchNotes();
    }
  }, [isOpen, userId, courseId, lectureId]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const response = await getNotesService(userId, courseId, lectureId);
      console.log("Get notes response:", response);
      if (response.success && response.data) {
        setNotes(response.data.content);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!notes.trim()) {
      toast.error("Notes cannot be empty");
      return;
    }

    console.log("Saving notes:", { userId, courseId, lectureId, content: notes });
    try {
      setIsSaving(true);
      const response = await saveNotesService(userId, courseId, lectureId, notes);
      console.log("Save notes response:", response);
      if (response.success) {
        toast.success("Notes saved successfully");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!notes.trim()) {
      toast.error("No notes to delete");
      return;
    }

    if (!window.confirm("Are you sure you want to delete these notes?")) {
      return;
    }

    console.log("Deleting notes for:", { userId, courseId, lectureId });
    try {
      setIsSaving(true);
      const response = await deleteNotesService(userId, courseId, lectureId);
      console.log("Delete notes response:", response);
      if (response.success) {
        setNotes("");
        toast.success("Notes deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting notes:", error);
      toast.error("Failed to delete notes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed bottom-32 right-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
          >
            <FaStickyNote size={32} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Take Lecture Notes</p>
        </TooltipContent>
      </Tooltip>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Lecture Notes</h3>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors hover:scale-105"
                    >
                      <FaSave size={24} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save Notes</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors hover:scale-105"
                    >
                      <FaTrash size={24} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete Notes</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Take your notes here..."
                className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSaving}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes; 