import { create } from "zustand";

interface ICoursesStore {
  courses: [];
  loading: boolean;
}

interface ICoursesStoreActions {
  fetchItems: () => Promise<void>;
}

type TCoursesStore = ICoursesStore & ICoursesStoreActions;

const initialState: ICoursesStore = {
  courses: [],
  loading: false,
};

const useCoursesStore = create<TCoursesStore>((set) => ({
  ...initialState,
  fetchItems: async () => {
    try {
      set({ loading: true });
      const response = await fetch("/api/courses");
      const data = await response.json();
      set({ courses: data, loading: false });
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      set({ loading: false });
    }
  },
}));

export default useCoursesStore;
