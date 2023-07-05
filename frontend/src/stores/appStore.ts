import { create } from "zustand";

type AppStore = {
  searchIndex: string;
  setSearchIndex: (searchIndex: string) => void;
};

const useAppStore = create<AppStore>((set, get) => ({
  searchIndex: "",
  setSearchIndex: (searchIndex: string) => set({ searchIndex }),
}));

export default useAppStore;
