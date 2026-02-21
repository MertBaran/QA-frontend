import { Box, Skeleton as MuiSkeleton, List, ListItem, ListItemText } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';

export const ProfileQuestionsListSkeleton = ({ count = 3 }: { count?: number }) => {
    const { mode } = useAppSelector(state => state.theme);

    return (
        <List>
            {Array.from({ length: count }).map((_, index) => (
                <ListItem
                    key={index}
                    sx={{
                        px: 0,
                        py: 2,
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <ListItemText
                        primary={
                            <MuiSkeleton
                                variant="text"
                                width="70%"
                                height={24}
                                sx={{
                                    mb: 0.5,
                                    bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                }}
                            />
                        }
                        secondary={
                            <Box>
                                <MuiSkeleton
                                    variant="text"
                                    width="100%"
                                    height={20}
                                    sx={{
                                        mb: 0.5,
                                        bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                    }}
                                />
                                <MuiSkeleton
                                    variant="text"
                                    width="95%"
                                    height={20}
                                    sx={{
                                        mb: 0.5,
                                        bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                    }}
                                />
                                <MuiSkeleton
                                    variant="text"
                                    width="90%"
                                    height={20}
                                    sx={{
                                        bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                    }}
                                />
                            </Box>
                        }
                    />
                    <Box sx={{ textAlign: 'right', ml: 2, minWidth: 100 }}>
                        <MuiSkeleton
                            variant="text"
                            width={80}
                            height={16}
                            sx={{
                                mb: 0.5,
                                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, justifyContent: 'flex-end' }}>
                            <MuiSkeleton
                                variant="text"
                                width={50}
                                height={16}
                                sx={{
                                    bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                }}
                            />
                            <MuiSkeleton
                                variant="text"
                                width={60}
                                height={16}
                                sx={{
                                    bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                }}
                            />
                        </Box>
                    </Box>
                </ListItem>
            ))}
        </List>
    );
};
