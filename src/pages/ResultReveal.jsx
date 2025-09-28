import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import useDrawStore from '../store/useDrawStore';
import ShippingFormModal from './ShippingFormModal';
import ImageCaptureQR from '../components/ImageCaptureQR';


function ResultReveal({ results, onFinish }) {
    const { displayMode,themeColor  } = useDrawStore();
    const [revealed, setRevealed] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showShippingModal, setShowShippingModal] = useState(false);

    const isHighRank = (item) => item.rank === 1 || item.rank === 2;

    // 전체 요약용 그룹화
    const groupedResults = results.reduce((acc, item) => {
        const key = `${item.rank}-${item.name}`;
        if (!acc[key]) {
            acc[key] = { ...item, count: 1 };
        } else {
            acc[key].count += 1;
        }
        return acc;
    }, {});
    const summary = Object.values(groupedResults).sort((a, b) => a.rank - b.rank);
    const needsShipping = summary.some((r) => r.requiresShipping);

    const renderLabel = (item) => {
        if (displayMode === 'rank') return `${item.rank}등`;
        if (displayMode === 'prize') return `${item.name}`;
        return `${item.rank}등 - ${item.name}`;
    };

    const handleReveal = (index) => {
        const item = results[index];

        if (isHighRank(item)) {
            setShowConfetti(true); // ❗️ 끄지 않음!
        }

        setTimeout(() => {
            setRevealed((prev) => [...prev, index]);
        }, isHighRank(item) ? 500 : 0);
    };

    const handleShowSummary = () => {
        setShowSummary(true);
    };

    useEffect(() => {
        // 자동 reveal for 일반 등수
        if (currentIndex < results.length) {
            const item = results[currentIndex];
            if (!isHighRank(item)) {
                handleReveal(currentIndex);
            }
        }
    }, [currentIndex]);

    const handleFinish = () => {
        setShowConfetti(false); // ✅ 이 시점에만 컨페티 끔
        onFinish();             // 외부 종료 콜백 호출
    };

    return (
        <div className="draw-contents">
            {showConfetti && (
                <Confetti
                    className="no-capture confetti-canvas"
                    numberOfPieces={120}
                    gravity={0.3}
                />
            )}

            {!showSummary ? (
                <div>
                    <h2>당첨 결과</h2>
                    <ul>
                        {results.map((r, i) => {
                            const isHigh = isHighRank(r);
                            const isRevealed = revealed.includes(i);
                            return (
                                <li
                                    key={i}
                                    className={`fade-in rank-${r.rank} ${isHigh ? themeColor : ''}`}
                                    data-rank={r.rank}
                                    data-label={renderLabel(r)}
                                    style={{ '--fade-index': i }}
                                >
                                    {isHigh && !isRevealed ? (
                                        <div className="pulse" onClick={() => handleReveal(i)}>
                                            <span>♥</span>
                                        </div>
                                    ) : (
                                        <span className={isHigh ? 'reveal-text' : ''}>
                                            {renderLabel(r)}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    <button className={`go-draw no-capture ${themeColor}`} onClick={handleShowSummary} style={{ width: 260 }}>
                        전체 결과 보기
                    </button>
                    {results.some((r, i) => isHighRank(r) && revealed.includes(i)) && (
                        <ImageCaptureQR revealedIndexes={revealed} results={results} />
                    )}
                </div>
            ) : (
                <div>
                    <h2 className="draw-result">전체 당첨 결과</h2>
                    <ul>
                        {summary.map((r, i) => (
                            <li key={i}>
                                {renderLabel(r)} ({r.count}개)
                            </li>
                        ))}
                    </ul>

                    {needsShipping && (
                        <button
                            className={`go-draw no-capture ${themeColor}`}
                            onClick={() => setShowShippingModal(true)}
                        >
                            배송 정보 입력하기
                        </button>
                    )}

                    <button className={`go-draw no-capture ${themeColor}`} onClick={handleFinish}>
                        확인 완료
                    </button>
                </div>
            )}

            {showShippingModal && (
                <ShippingFormModal
                    prizes={summary}
                    onClose={() => setShowShippingModal(false)}
                />
            )}
        </div>
    );
}

export default ResultReveal;
