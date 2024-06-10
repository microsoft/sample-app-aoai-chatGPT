export interface ChildItem {
    [key: string]: string;
}

export interface CategoryItem {
    category: string;
    child: ChildItem[];
}

export interface Tags {
    id: string;
    who: CategoryItem[];
    where: CategoryItem[];
    activities: CategoryItem[];
    prioritize: CategoryItem[];
    // product: CategoryItem[];
}
