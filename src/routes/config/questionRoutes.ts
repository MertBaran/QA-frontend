// Question routes (protected)
export const questionRoutes = [
  {
    path: '/questions',
    component: 'Questions',
    exact: true,
  },
  {
    path: '/questions/:id',
    component: 'QuestionDetail',
    exact: true,
  },
  {
    path: '/ask',
    component: 'AskQuestion',
    exact: true,
  },
];
