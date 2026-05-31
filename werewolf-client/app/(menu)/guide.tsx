import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ImageBackground, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const pages = [
  {
    title: "CỐT TRUYỆN & LUẬT CHƠI",
    content: "Chào mừng bạn đến với Ngôi Làng Sương Mù.\n\nTrò chơi chia làm 2 giai đoạn luân phiên:\n\n🌙 BAN ĐÊM:\nMa sói sẽ thức giấc và chọn 1 con mồi. Các chức năng đặc biệt (Tiên tri, Phù thủy, Bảo vệ...) cũng hành động bí mật trong bóng tối.\n\n☀️ BAN NGÀY:\nTất cả thức dậy (ai bị giết sẽ biến mất). Mọi người thảo luận để tìm ra Sói và tiến hành Vote treo cổ kẻ tình nghi nhất.\n\n🏆 ĐIỀU KIỆN THẮNG:\n- Sói: Số lượng Sói >= Số lượng Dân.\n- Dân: Tiêu diệt toàn bộ Sói."
  },
  {
    title: "PHE DÂN LÀNG (VILLAGERS)",
    content: "👩‍🌾 Dân thường: Không có chức năng, chỉ thảo luận và vote.\n\n👁️ Tiên tri: Soi 1 người mỗi đêm xem là Sói hay Dân.\n\n🧪 Phù thủy: Có 1 bình cứu mạng và 1 bình thuốc độc.\n\n🛡️ Bảo vệ: Chắn 1 người khỏi móng vuốt Sói mỗi đêm.\n\n🔫 Thợ săn: Nếu chết, được bắn kéo theo 1 người.\n\n💘 Thần tình yêu: Gắn kết 2 người, 1 người chết kẻ kia chết theo.\n\n👴 Già làng: Có 2 mạng, nếu bị treo cổ dân sẽ mất hết chức năng.\n\n👑 Thị trưởng: Phiếu bầu tính bằng 2 phiếu."
  },
  {
    title: "PHE MA SÓI (WEREWOLVES)",
    content: "🐺 Sói thường: Cùng phe Sói vote giết 1 người mỗi đêm.\n\n🐾 Sói con: Nếu chết, đêm sau phe Sói được giết tận 2 người (để trả thù).\n\n❄️ Sói trắng: Cứ 2 đêm được giết thêm 1 con Sói khác. Thắng khi là kẻ duy nhất sống sót trong làng.\n\n🔮 Sói tiên tri: Mỗi đêm soi 1 người để biết chức năng của họ là gì."
  },
  {
    title: "PHE THỨ 3 (THIRD PARTY)",
    content: "🤡 Kẻ chán đời (Tanner): Chỉ thắng khi bị treo cổ vào ban ngày.\n\n🎵 Kẻ thổi sáo: Mỗi đêm thôi miên 2 người, thắng khi tất cả người sống đều bị thôi miên.\n\n🔪 Sát thủ (Serial Killer): Mỗi đêm giết 1 người bất kể phe nào. Mục tiêu là người sống sót duy nhất.\n\n🐾 Nửa người nửa sói: Chọn 1 'Thần tượng'. Khi thần tượng chết, đổi phe từ Dân sang Sói."
  }
];

export default function GuideScreen() {
    const [currentPage, setCurrentPage] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = right, -1 = left

    const nextPage = () => {
        if (currentPage < pages.length - 1) {
            setDirection(1);
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setDirection(-1);
            setCurrentPage(prev => prev - 1);
        }
    };

    return (
        <View style={styles.container}>
            <ImageBackground source={require('../../assets/images/lobby_bg.png')} style={styles.bg} resizeMode="cover" blurRadius={3}>
                <View style={styles.overlay} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrapper}>
                        <Text style={styles.backBtn}>{'< TRỞ VỀ'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>HƯỚNG DẪN CHƠI</Text>
                    <View style={{ width: 60 }} />
                </View>

                {/* Book Area */}
                <View style={styles.bookContainer}>
                    {/* Left Arrow */}
                    <TouchableOpacity 
                        style={[styles.arrowBtn, currentPage === 0 && styles.disabledArrow]} 
                        onPress={prevPage}
                        disabled={currentPage === 0}
                    >
                        <FontAwesome5 name="chevron-left" size={30} color={currentPage === 0 ? "#555" : "#d4c391"} />
                    </TouchableOpacity>

                    {/* Book Page Wrapper */}
                    <View style={styles.pageWrapper}>
                        {/* Book Styling (Binding & Shadows) */}
                        <View style={styles.bookBinding} />
                        <View style={styles.pageShadow} />

                        <AnimatePresence custom={direction}>
                            <MotiView
                                key={currentPage}
                                from={{ opacity: 0, translateX: direction * 50, rotateY: direction * 10 + 'deg' }}
                                animate={{ opacity: 1, translateX: 0, rotateY: '0deg' }}
                                exit={{ opacity: 0, translateX: -direction * 50, rotateY: -direction * 10 + 'deg' }}
                                transition={{ type: 'timing', duration: 350 }}
                                style={styles.pageContent}
                            >
                                <Text style={styles.pageTitle}>{pages[currentPage].title}</Text>
                                <View style={styles.divider} />
                                
                                <ScrollView 
                                    style={{ flex: 1, marginBottom: 30 }}
                                    showsVerticalScrollIndicator={true}
                                    contentContainerStyle={{ paddingBottom: 10 }}
                                >
                                    <Text style={styles.pageText}>{pages[currentPage].content}</Text>
                                </ScrollView>
                                
                                <Text style={styles.pageNumber}>- {currentPage + 1} -</Text>
                            </MotiView>
                        </AnimatePresence>
                    </View>

                    {/* Right Arrow */}
                    <TouchableOpacity 
                        style={[styles.arrowBtn, currentPage === pages.length - 1 && styles.disabledArrow]} 
                        onPress={nextPage}
                        disabled={currentPage === pages.length - 1}
                    >
                        <FontAwesome5 name="chevron-right" size={30} color={currentPage === pages.length - 1 ? "#555" : "#d4c391"} />
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505' },
    bg: { flex: 1, width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 5, 5, 0.7)' },
    
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        padding: 20, paddingTop: 50, alignItems: 'center',
        borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    backBtnWrapper: { padding: 5 },
    backBtn: { color: '#d4c391', fontSize: 16, fontWeight: 'bold' },
    title: { color: '#d4c391', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
    
    bookContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    
    arrowBtn: {
        padding: 15,
        zIndex: 10,
    },
    disabledArrow: {
        opacity: 0.5
    },

    pageWrapper: {
        width: width * 0.75,
        maxWidth: 450,
        height: '75%',
        backgroundColor: '#e8d3a7', // Old paper color
        borderRadius: 5,
        borderTopRightRadius: 15,
        borderBottomRightRadius: 15,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 10, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10,
    },
    bookBinding: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 25,
        backgroundColor: '#3e2723', // Dark leather spine
        zIndex: 5,
        borderRightWidth: 2,
        borderColor: '#2d1b18'
    },
    pageShadow: {
        position: 'absolute',
        left: 25,
        top: 0,
        bottom: 0,
        width: 15,
        backgroundColor: 'rgba(0,0,0,0.15)',
        zIndex: 4,
    },

    pageContent: {
        position: 'absolute',
        left: 25, // offset for binding
        right: 0,
        top: 0,
        bottom: 0,
        padding: 20,
        paddingLeft: 30,
        backgroundColor: '#e8d3a7',
    },
    
    pageTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#5c1606', // Dark blood red/brown
        textAlign: 'center',
        marginTop: 10,
        fontFamily: 'serif',
    },
    divider: {
        height: 2,
        backgroundColor: '#5c1606',
        opacity: 0.3,
        marginVertical: 15,
        marginHorizontal: 20,
    },
    pageText: {
        fontSize: 15,
        color: '#2a1a14', // Very dark brown
        lineHeight: 24,
        fontFamily: 'serif',
    },
    pageNumber: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#5c1606',
        opacity: 0.6,
    }
});
