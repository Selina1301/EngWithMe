/**
 * MASTER TOEIC LISTENING DATA INDEX AGGREGATOR
 * Quản lý & Tổng hợp dữ liệu TOEIC Listening theo từng Part
 */
(function () {
  const p1 = window.LISTENING_TOEIC_PART1 || [];
  const p2 = window.LISTENING_TOEIC_PART2 || [];
  const p3 = window.LISTENING_TOEIC_PART3 || [];
  const p4 = window.LISTENING_TOEIC_PART4 || [];

  window.TOEIC_PART1_TESTS = p1;
  window.TOEIC_PART2_TESTS = p2;
  window.TOEIC_PART3_TESTS = p3;
  window.TOEIC_PART4_TESTS = p4;

  window.TOEIC_FULL_DATA = {
    part1: p1,
    part2: p2,
    part3: p3,
    part4: p4
  };
})();
