import { useState, useEffect } from 'react';

/**
 * useCountDown hook
 * Dùng timestamp Date.now() để trừ thời gian đích (endTime),
 * nên dù thiết bị lag hụt 2-3 fps, thì độ dài đếm ngược vẫn không sai số so với Server
 */
const useCountDown = (endTime) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = endTime - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };

    // Khởi tạo ngay lập tức không cần đợi tick đầu tiên của setInterval
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft; // Số giây còn lại
};

export default useCountDown;
