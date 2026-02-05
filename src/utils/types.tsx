export interface CustomTextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8';
    style?: any;
    fontSize?: number;
    children: React.ReactNode;
    fontFamily?: 'SemiBold' | 'Regular' | 'Bold' | 'Medium' | 'Light';
    numberOfLines?: number;
}

export interface CustomButtonProps {
    onPress: () => void;
    title: string;
    disabled?: boolean;
    loading?: boolean;
}

export interface Book {
    _id?: string;
    bookId?: string;
    BookID?: string;
    title: string;
    author?: string;
    coverImage?: string;
    iconUrl?: string;
    uploadDate?: string;
    uploadedAt?: string;
    viewCount?: number;
    likeCount?: number;
    percentage?: number;
    filename?: string;
}