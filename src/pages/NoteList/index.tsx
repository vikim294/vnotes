import { useEffect, useRef, useState } from "react";
import Button from "../../components/Button";
import type { NoteListItem } from "../../types/note";
import useModal from "../../components/useModal";
import { API_BASE_URL } from "../../api";

export default function NoteList() {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const currentNoteRef = useRef<NoteListItem | null>(null);

  // add node
  const {
    Modal: AddModal,
    openModal: openAddModal,
    closeModal: closeAddModal,
  } = useModal();

  const [newNoteTitle, setNewNoteTitle] = useState("");

  const openCreateNoteModal = () => {
    setNewNoteTitle("");
    openAddModal();
  };

  const confirmCreateNote = async () => {
    const response = await fetch(`${API_BASE_URL}/note/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newNoteTitle,
      }),
    });
    const res = await response.json();
    if (res.code === 0) {
      getNotes();
      closeAddModal();
    }
  };

  // edit node
  const {
    Modal: EditModal,
    openModal: openEditModal,
    closeModal: closeEditModal,
  } = useModal();

  const handleEditNote = (note: NoteListItem) => {
    currentNoteRef.current = note;
    openEditModal();
    setNewNoteTitle(note.title);
  };

  const confirmEditNote = async () => {
    const response = await fetch(`${API_BASE_URL}/note/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: currentNoteRef.current?.id,
        title: newNoteTitle,
      }),
    });
    const res = await response.json();
    if (res.code === 0) {
      closeEditModal();
      getNotes();
    }
  };

  // delete node
  const {
    Modal: DeleteConfirmModal,
    openModal: openDeleteConfirmModal,
    closeModal: closeDeleteConfirmModal,
  } = useModal();

  const handleDeleteNote = (note: NoteListItem) => {
    currentNoteRef.current = note;
    openDeleteConfirmModal();
  };

  const confirmDeleteNote = async () => {
    const response = await fetch(`${API_BASE_URL}/note/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: currentNoteRef.current?.id,
      }),
    });
    const res = await response.json();
    if (res.code === 0) {
      closeDeleteConfirmModal();
      getNotes();
    }
  };

  const getNotes = async () => {
    const response = await fetch(`${API_BASE_URL}/note/list`);
    const res = await response.json();
    if (res.code === 0) {
      setNotes(res.data);
    }
  };

  useEffect(() => {
    getNotes();
  }, []);

  return (
    <div>
      <div>
        <Button type="primary" onClick={openCreateNoteModal}>
          new note
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="flex justify-between text-white">
            <div>{note.title}</div>

            <div className="">
              <Button className="mr-2" onClick={() => handleEditNote(note)}>
                edit
              </Button>
              <Button type="danger" onClick={() => handleDeleteNote(note)}>
                delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* modals */}
      <AddModal
        header="new note"
        footer={
          <div>
            <Button onClick={closeAddModal}>cancel</Button>
            <Button type="primary" onClick={confirmCreateNote}>
              confirm
            </Button>
          </div>
        }
      >
        <label>
          Title:
          <input
            type="text"
            className="bg-textarea w-full p-2 outline-none"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
          />
        </label>
      </AddModal>

      <EditModal
        header="edit note"
        footer={
          <div>
            <Button onClick={closeEditModal}>cancel</Button>
            <Button type="primary" onClick={confirmEditNote}>
              confirm
            </Button>
          </div>
        }
      >
        <label>
          new title:
          <input
            type="text"
            className="bg-textarea w-full p-2 outline-none"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
          />
        </label>
      </EditModal>

      <DeleteConfirmModal
        header="are you sure to delete this note?"
        footer={
          <div>
            <Button onClick={closeDeleteConfirmModal}>cancel</Button>
            <Button type="primary" onClick={confirmDeleteNote}>
              confirm
            </Button>
          </div>
        }
      ></DeleteConfirmModal>
    </div>
  );
}
