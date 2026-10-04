import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AddBookmarkRequest } from '../types/bookmark';
import BookmarkAddModal from '../components/bookmark/BookmarkAddModal';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchCollections, fetchCollectionItems } from '../store/bookmarks/bookmarkCollectionThunks';

interface BookmarkAddContextValue {
  openAddModal: (payload: AddBookmarkRequest, bookmarkId?: string | null) => void;
}

const BookmarkAddContext = createContext<BookmarkAddContextValue | null>(null);

export const useBookmarkAdd = () => {
  const ctx = useContext(BookmarkAddContext);
  return ctx;
};

export const BookmarkAddProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const [payload, setPayload] = useState<AddBookmarkRequest | null>(null);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const { currentLanguage } = useAppSelector((s) => s.language);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { items: bookmarks } = useAppSelector((s) => s.bookmarks);
  const { collections } = useAppSelector((s) => s.bookmarkCollections);

  // Bookmark butonlarının dolu/boş durumu için: hangi bookmark hangi klasörde - fetch
  useEffect(() => {
    if (!isAuthenticated || bookmarks.length === 0) return;
    dispatch(fetchCollections());
  }, [isAuthenticated, bookmarks.length, dispatch]);

  useEffect(() => {
    if (!isAuthenticated || collections.length === 0) return;
    collections.forEach((c) => dispatch(fetchCollectionItems(c._id)));
  }, [isAuthenticated, collections, dispatch]);

  const openAddModal = useCallback((p: AddBookmarkRequest, bid?: string | null) => {
    setPayload(p);
    setBookmarkId(bid ?? null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setPayload(null);
    setBookmarkId(null);
  }, []);

  return (
    <BookmarkAddContext.Provider value={{ openAddModal }}>
      {children}
      <BookmarkAddModal
        open={modalOpen}
        onClose={closeModal}
        payload={payload}
        bookmarkId={bookmarkId}
        currentLanguage={currentLanguage}
        onSuccess={() => {}}
      />
    </BookmarkAddContext.Provider>
  );
};
