export interface MockQuestion {
  id: number;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  tags: string[];
  likes: number;
  answers: number;
  views: number;
  timeAgo: string;
  isTrending: boolean;
  category: string;
}

export const mockQuestions: MockQuestion[] = [
  {
    id: 1,
    title: 'React Hooks ile state management nasıl yapılır?',
    content:
      'React Hooks kullanarak state management yapmak istiyorum. Redux yerine Context API ve useReducer kullanarak nasıl bir yapı kurabilirim?',
    author: {
      name: 'Ahmet Yılmaz',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    tags: ['React', 'JavaScript', 'Hooks'],
    likes: 24,
    answers: 8,
    views: 156,
    timeAgo: '2 saat önce',
    isTrending: true,
    category: 'Frontend',
  },
  {
    id: 2,
    title: 'TypeScript ile generic types nasıl kullanılır?',
    content:
      "TypeScript'te generic types kullanarak daha esnek ve type-safe kod yazmak istiyorum. Örneklerle açıklayabilir misiniz?",
    author: {
      name: 'Zeynep Kaya',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    tags: ['TypeScript', 'Generics'],
    likes: 18,
    answers: 5,
    views: 89,
    timeAgo: '4 saat önce',
    isTrending: false,
    category: 'Frontend',
  },
  {
    id: 3,
    title: 'MongoDB aggregation pipeline örnekleri',
    content:
      "MongoDB'de aggregation pipeline kullanarak karmaşık sorgular yapmak istiyorum. Performanslı örnekler paylaşabilir misiniz?",
    author: {
      name: 'Mehmet Demir',
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
    tags: ['MongoDB', 'Database', 'Aggregation'],
    likes: 32,
    answers: 12,
    views: 234,
    timeAgo: '6 saat önce',
    isTrending: true,
    category: 'Backend',
  },
  {
    id: 4,
    title: 'Docker container orchestration best practices',
    content:
      "Docker container'ları production ortamında nasıl yönetebilirim? Kubernetes alternatifi olarak hangi araçları kullanabilirim?",
    author: {
      name: 'Elif Özkan',
      avatar: 'https://i.pravatar.cc/150?img=4',
    },
    tags: ['Docker', 'DevOps', 'Containerization'],
    likes: 15,
    answers: 6,
    views: 67,
    timeAgo: '8 saat önce',
    isTrending: false,
    category: 'DevOps',
  },
  {
    id: 5,
    title: 'Node.js performance optimization techniques',
    content:
      "Node.js uygulamamın performansını nasıl artırabilirim? Memory leak'leri nasıl tespit edebilirim?",
    author: {
      name: 'Can Arslan',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    tags: ['Node.js', 'Performance', 'JavaScript'],
    likes: 28,
    answers: 9,
    views: 178,
    timeAgo: '1 gün önce',
    isTrending: true,
    category: 'Backend',
  },
  {
    id: 6,
    title: 'CSS Grid vs Flexbox ne zaman kullanılır?',
    content:
      'CSS Grid ve Flexbox arasındaki farkları ve hangi durumlarda hangisini tercih etmem gerektiğini öğrenmek istiyorum.',
    author: {
      name: 'Selin Yıldız',
      avatar: 'https://i.pravatar.cc/150?img=6',
    },
    tags: ['CSS', 'Grid', 'Flexbox', 'Layout'],
    likes: 22,
    answers: 7,
    views: 145,
    timeAgo: '1 gün önce',
    isTrending: false,
    category: 'Frontend',
  },
  {
    id: 7,
    title: 'GraphQL vs REST API karşılaştırması',
    content:
      'Yeni bir proje başlatıyorum ve GraphQL mi yoksa REST API mi kullanacağım konusunda kararsızım. Avantaj ve dezavantajları nelerdir?',
    author: {
      name: 'Burak Koç',
      avatar: 'https://i.pravatar.cc/150?img=7',
    },
    tags: ['GraphQL', 'REST', 'API', 'Backend'],
    likes: 35,
    answers: 14,
    views: 289,
    timeAgo: '2 gün önce',
    isTrending: true,
    category: 'Backend',
  },
  {
    id: 8,
    title: 'React Native navigation best practices',
    content:
      'React Native uygulamamda navigation yapısını nasıl optimize edebilirim? Deep linking nasıl implement edilir?',
    author: {
      name: 'Deniz Aydın',
      avatar: 'https://i.pravatar.cc/150?img=8',
    },
    tags: ['React Native', 'Navigation', 'Mobile'],
    likes: 19,
    answers: 6,
    views: 98,
    timeAgo: '2 gün önce',
    isTrending: false,
    category: 'Mobile',
  },
];

// Filtreleme fonksiyonları
export const filterQuestions = (
  questions: MockQuestion[],
  filters: {
    search: string;
    category: string;
    tags: string;
    sortBy: string;
  },
): MockQuestion[] => {
  let filtered = [...questions];

  // Arama filtresi
  if (filters.search) {
    filtered = filtered.filter(
      (question) =>
        question.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        question.content.toLowerCase().includes(filters.search.toLowerCase()) ||
        question.tags.some((tag) => tag.toLowerCase().includes(filters.search.toLowerCase())),
    );
  }

  // Kategori filtresi
  if (filters.category) {
    filtered = filtered.filter((question) => question.category === filters.category);
  }

  // Tag filtresi
  if (filters.tags) {
    filtered = filtered.filter((question) =>
      question.tags.some((tag) => tag.toLowerCase().includes(filters.tags.toLowerCase())),
    );
  }

  // Sıralama
  switch (filters.sortBy) {
    case 'En Yeni':
      // timeAgo'ya göre sıralama (basit implementasyon)
      break;
    case 'En Popüler':
      filtered.sort((a, b) => b.likes - a.likes);
      break;
    case 'En Çok Görüntülenen':
      filtered.sort((a, b) => b.views - a.views);
      break;
    case 'En Çok Cevaplanan':
      filtered.sort((a, b) => b.answers - a.answers);
      break;
    default:
      break;
  }

  return filtered;
};

// Kategoriler
export const categories = ['Frontend', 'Backend', 'Mobile', 'DevOps', 'Database', 'AI/ML'];

// Sıralama seçenekleri
export const sortOptions = ['En Yeni', 'En Popüler', 'En Çok Görüntülenen', 'En Çok Cevaplanan'];
