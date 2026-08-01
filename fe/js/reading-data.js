(function () {
  const READING_LESSONS_FALLBACK = [
    {
      id: "schedule-change",
      level: "easy",
      title: "Schedule Change",
      description: "Chủ đề: thay đổi lịch họp và chuẩn bị báo cáo.",
      lines: [
        ["A: Hi Karen, have you seen the updated schedule for tomorrow's product briefing?", "A: Chào Karen, bạn đã xem lịch cập nhật cho buổi họp giới thiệu sản phẩm ngày mai chưa?"],
        ["B: Not yet. Was there a change?", "B: Chưa. Có thay đổi gì à?"],
        ["A: Yes, the meeting has been moved from 10 a.m. to 1:30 p.m. because the regional manager's flight was delayed.", "A: Có, cuộc họp đã được chuyển từ 10 giờ sáng sang 1 giờ 30 chiều vì chuyến bay của quản lý khu vực bị hoãn."],
        ["B: Thanks for letting me know. Should I still bring the quarterly sales report?", "B: Cảm ơn đã báo cho tôi biết. Tôi vẫn nên mang báo cáo doanh số theo quý chứ?"],
        ["A: Definitely. Mr. Lawson wants to review the latest figures before we finalize next month's marketing plan.", "A: Chắc chắn rồi. Ông Lawson muốn xem lại các số liệu mới nhất trước khi chúng ta chốt kế hoạch marketing tháng tới."],
        ["B: Understood. I'll make sure the numbers are updated and printed before lunch.", "B: Đã hiểu. Tôi sẽ đảm bảo các số liệu được cập nhật và in ra trước bữa trưa."]
      ],
      vocab: ["updated schedule = lịch đã cập nhật", "product briefing = buổi họp giới thiệu sản phẩm", "regional manager = quản lý khu vực", "quarterly sales report = báo cáo doanh số theo quý", "finalize = hoàn tất / chốt lại"]
    },
    {
      id: "office-supplies",
      level: "easy",
      title: "Office Supplies",
      description: "Chủ đề: kiểm tra văn phòng phẩm cho buổi đào tạo.",
      lines: [
        ["A: Mark, do we still have enough folders and printer paper for the training session this afternoon?", "A: Mark, chúng ta còn đủ bìa hồ sơ và giấy in cho buổi đào tạo chiều nay không?"],
        ["B: We have plenty of paper, but we're running low on folders. I only found about fifteen in the storage room.", "B: Giấy thì còn nhiều, nhưng bìa hồ sơ sắp hết. Tôi chỉ tìm thấy khoảng mười lăm cái trong phòng chứa đồ."],
        ["A: That won't be enough. We're expecting at least thirty participants.", "A: Như vậy sẽ không đủ. Chúng ta dự kiến có ít nhất ba mươi người tham gia."],
        ["B: I can stop by the supply store during my lunch break and pick up some extra ones.", "B: Tôi có thể ghé cửa hàng văn phòng phẩm trong giờ nghỉ trưa và mua thêm một ít."],
        ["A: That would be very helpful. Please also get a few packs of name tags if they're available.", "A: Như vậy sẽ rất hữu ích. Nếu có, hãy mua thêm vài gói bảng tên nữa nhé."],
        ["B: No problem. I'll keep the receipt and submit it with my expense report.", "B: Không vấn đề gì. Tôi sẽ giữ hóa đơn và nộp kèm báo cáo chi phí."]
      ],
      vocab: ["running low on = sắp hết", "storage room = phòng chứa đồ", "participants = người tham gia", "name tags = bảng tên", "submit a receipt = nộp hóa đơn"]
    },
    {
      id: "client-visit",
      level: "easy",
      title: "Client Visit",
      description: "Chủ đề: chuẩn bị phòng họp và đón khách hàng.",
      lines: [
        ["A: Good morning, Lisa. Are we ready for the clients from Brighton Consulting?", "A: Chào buổi sáng, Lisa. Chúng ta đã sẵn sàng đón khách từ Brighton Consulting chưa?"],
        ["B: Almost. I've prepared the conference room and tested the projector, but the catering order hasn't arrived yet.", "B: Gần xong rồi. Tôi đã chuẩn bị phòng họp và kiểm tra máy chiếu, nhưng đơn đồ ăn/thức uống vẫn chưa đến."],
        ["A: Did the restaurant confirm the delivery time?", "A: Nhà hàng đã xác nhận thời gian giao chưa?"],
        ["B: Yes, they said it should be here within twenty minutes. I ordered coffee, tea, bottled water, and some light refreshments.", "B: Rồi, họ nói đơn sẽ đến trong vòng hai mươi phút. Tôi đã đặt cà phê, trà, nước đóng chai và một ít đồ ăn nhẹ."],
        ["A: Excellent. Since this is their first visit, we want to make a polished impression.", "A: Tuyệt. Vì đây là lần đầu họ đến, chúng ta muốn tạo ấn tượng chuyên nghiệp và chỉn chu."],
        ["B: Absolutely. I'll also place the company brochures near the entrance.", "B: Chắc chắn rồi. Tôi cũng sẽ đặt tài liệu giới thiệu công ty gần lối vào."]
      ],
      vocab: ["catering order = đơn đặt đồ ăn/thức uống cho sự kiện", "light refreshments = đồ ăn nhẹ", "polished impression = ấn tượng chuyên nghiệp, chỉn chu", "company brochures = tài liệu giới thiệu công ty", "near the entrance = gần lối vào"]
    },
    {
      id: "delivery-delay",
      level: "easy",
      title: "Delivery Delay",
      description: "Chủ đề: hỏi tình trạng đơn hàng bị giao trễ.",
      lines: [
        ["A: Hello, this is Daniel from Westbrook Electronics. I'm calling about our order placed last Monday.", "A: Xin chào, tôi là Daniel từ Westbrook Electronics. Tôi gọi về đơn hàng chúng tôi đã đặt vào thứ Hai tuần trước."],
        ["B: Good afternoon, Mr. Daniel. Let me check the status for you. Do you have the order number?", "B: Chào buổi chiều, ông Daniel. Để tôi kiểm tra tình trạng cho ông. Ông có mã đơn hàng không?"],
        ["A: Yes, it's WB-4729. We were expecting the shipment yesterday, but nothing has arrived.", "A: Có, mã là WB-4729. Chúng tôi dự kiến nhận lô hàng hôm qua, nhưng vẫn chưa có gì đến."],
        ["B: I apologize for the inconvenience. It looks like the package was held up at the distribution center due to a labeling issue.", "B: Tôi xin lỗi vì sự bất tiện này. Có vẻ kiện hàng bị giữ lại ở trung tâm phân phối do vấn đề nhãn hàng."],
        ["A: When can we expect it to be delivered?", "A: Khi nào chúng tôi có thể nhận được hàng?"],
        ["B: The issue has been resolved, and the shipment is scheduled to arrive by tomorrow afternoon.", "B: Vấn đề đã được giải quyết, và lô hàng dự kiến đến vào chiều mai."]
      ],
      vocab: ["placed an order = đặt hàng", "shipment = lô hàng", "held up = bị trì hoãn", "distribution center = trung tâm phân phối", "labeling issue = vấn đề về nhãn hàng"]
    },
    {
      id: "hotel-reservation",
      level: "easy",
      title: "Hotel Reservation",
      description: "Chủ đề: nhận phòng khách sạn và hỏi giờ ăn sáng.",
      lines: [
        ["A: Good evening. I have a reservation under the name Thompson.", "A: Chào buổi tối. Tôi có đặt phòng dưới tên Thompson."],
        ["B: Welcome, Mr. Thompson. Let me pull up your booking. You'll be staying with us for three nights, correct?", "B: Chào mừng ông Thompson. Để tôi mở thông tin đặt phòng của ông. Ông sẽ ở lại ba đêm, đúng không ạ?"],
        ["A: That's right. I also requested a quiet room away from the elevator.", "A: Đúng vậy. Tôi cũng đã yêu cầu một phòng yên tĩnh, xa thang máy."],
        ["B: Yes, we've arranged a room on the eighth floor facing the courtyard. It should be very quiet.", "B: Vâng, chúng tôi đã sắp xếp một phòng ở tầng tám nhìn ra sân trong. Phòng đó sẽ rất yên tĩnh."],
        ["A: Wonderful. Could you tell me what time breakfast is served?", "A: Tuyệt vời. Bạn có thể cho tôi biết bữa sáng được phục vụ lúc mấy giờ không?"],
        ["B: Certainly. Breakfast is available from 6:30 to 10 a.m. in the restaurant next to the lobby.", "B: Tất nhiên. Bữa sáng có từ 6:30 đến 10 giờ sáng tại nhà hàng cạnh sảnh."]
      ],
      vocab: ["reservation under the name = đặt phòng dưới tên", "pull up your booking = mở thông tin đặt phòng", "away from the elevator = xa thang máy", "facing the courtyard = nhìn ra sân trong", "breakfast is served = bữa sáng được phục vụ"]
    },
    {
      id: "job-interview-easy",
      level: "easy",
      title: "Job Interview",
      description: "Chủ đề: ứng viên đến phỏng vấn và chuẩn bị hồ sơ.",
      lines: [
        ["A: Has the candidate for the marketing assistant position arrived yet?", "A: Ứng viên cho vị trí trợ lý marketing đã đến chưa?"],
        ["B: Yes, she checked in at reception about five minutes ago.", "B: Rồi, cô ấy đã báo có mặt ở quầy lễ tân khoảng năm phút trước."],
        ["A: Great. Did she bring a printed copy of her resume?", "A: Tốt. Cô ấy có mang bản in CV không?"],
        ["B: She did, and she also brought a portfolio with samples from her previous internship.", "B: Có, và cô ấy cũng mang theo portfolio có các mẫu từ kỳ thực tập trước."],
        ["A: That's impressive. Please ask her to wait in Meeting Room 2 while I finish this phone call.", "A: Ấn tượng đấy. Hãy mời cô ấy chờ ở Phòng họp 2 trong lúc tôi kết thúc cuộc gọi này."],
        ["B: Of course. I'll offer her some water and let her know you'll be with her shortly.", "B: Tất nhiên. Tôi sẽ mời cô ấy nước và báo rằng anh/chị sẽ gặp cô ấy ngay."]
      ],
      vocab: ["candidate = ứng viên", "checked in at reception = đã báo có mặt ở quầy lễ tân", "resume = sơ yếu lý lịch / CV", "portfolio = hồ sơ sản phẩm cá nhân", "previous internship = kỳ thực tập trước"]
    },
    {
      id: "software-update",
      level: "easy",
      title: "Software Update",
      description: "Chủ đề: cập nhật phần mềm và tránh gián đoạn công việc.",
      lines: [
        ["A: Hi Steven, have you installed the latest software update yet?", "A: Chào Steven, bạn đã cài bản cập nhật phần mềm mới nhất chưa?"],
        ["B: Not yet. I saw the notification, but I was worried it might interrupt my work.", "B: Chưa. Tôi đã thấy thông báo, nhưng lo rằng nó có thể làm gián đoạn công việc."],
        ["A: It only takes about ten minutes, and the IT department recommends installing it today.", "A: Nó chỉ mất khoảng mười phút, và bộ phận IT khuyên nên cài trong hôm nay."],
        ["B: Does it include any major changes?", "B: Nó có thay đổi lớn nào không?"],
        ["A: Mostly security improvements and a few new tools for managing customer data more efficiently.", "A: Chủ yếu là cải tiến bảo mật và vài công cụ mới để quản lý dữ liệu khách hàng hiệu quả hơn."],
        ["B: In that case, I'll install it during my afternoon break so it doesn't affect my current project.", "B: Nếu vậy, tôi sẽ cài trong giờ nghỉ chiều để không ảnh hưởng đến dự án hiện tại."]
      ],
      vocab: ["software update = bản cập nhật phần mềm", "notification = thông báo", "interrupt my work = làm gián đoạn công việc", "security improvements = cải tiến bảo mật", "efficiently = một cách hiệu quả"]
    },
    {
      id: "restaurant-booking",
      level: "easy",
      title: "Restaurant Booking",
      description: "Chủ đề: xác nhận đặt bàn và yêu cầu món chay.",
      lines: [
        ["A: Hi, I'd like to confirm a dinner reservation for this Friday evening.", "A: Xin chào, tôi muốn xác nhận đặt bàn ăn tối vào tối thứ Sáu này."],
        ["B: Certainly. May I have the name on the reservation?", "B: Tất nhiên. Cho tôi xin tên trên đặt chỗ được không?"],
        ["A: It's under Rachel Morgan, for eight people at 7 p.m.", "A: Dưới tên Rachel Morgan, cho tám người lúc 7 giờ tối."],
        ["B: Yes, I see it here. You requested a private table for a business dinner, correct?", "B: Vâng, tôi thấy rồi. Bà yêu cầu bàn riêng cho bữa tối công việc, đúng không ạ?"],
        ["A: Exactly. Also, one of our guests is vegetarian. Would it be possible to prepare a suitable option?", "A: Đúng vậy. Ngoài ra, một khách của chúng tôi ăn chay. Có thể chuẩn bị một lựa chọn phù hợp không?"],
        ["B: Absolutely. Our chef can prepare a vegetarian entree, and I'll make a note of that on your reservation.", "B: Chắc chắn. Đầu bếp của chúng tôi có thể chuẩn bị món chính chay, và tôi sẽ ghi chú điều đó vào đặt chỗ của bà."]
      ],
      vocab: ["confirm a reservation = xác nhận đặt chỗ", "private table = bàn riêng", "business dinner = bữa tối công việc", "vegetarian = người ăn chay", "make a note of that = ghi chú điều đó lại"]
    },
    {
      id: "store-return",
      level: "easy",
      title: "Store Return",
      description: "Chủ đề: trả hàng, hoàn tiền hoặc đổi sản phẩm.",
      lines: [
        ["A: Excuse me, I'd like to return this jacket. I bought it last week, but the zipper doesn't work properly.", "A: Xin lỗi, tôi muốn trả lại chiếc áo khoác này. Tôi mua nó tuần trước, nhưng khóa kéo không hoạt động đúng."],
        ["B: I'm sorry about that. Do you still have the receipt?", "B: Tôi rất tiếc về việc đó. Bạn còn giữ hóa đơn không?"],
        ["A: Yes, here it is. I only wore it once and noticed the problem this morning.", "A: Có, đây ạ. Tôi chỉ mặc một lần và phát hiện vấn đề sáng nay."],
        ["B: Thank you. Since the item is defective, we can offer you a full refund or an exchange.", "B: Cảm ơn. Vì sản phẩm bị lỗi, chúng tôi có thể hoàn tiền đầy đủ hoặc đổi hàng cho bạn."],
        ["A: I'd prefer an exchange if you still have the same jacket in a medium size.", "A: Tôi muốn đổi hàng nếu cửa hàng còn chiếc áo giống vậy cỡ M."],
        ["B: Let me check our inventory. It looks like we have one left in navy blue.", "B: Để tôi kiểm tra kho. Có vẻ chúng tôi còn một chiếc màu xanh navy."]
      ],
      vocab: ["return this jacket = trả lại áo khoác", "zipper = khóa kéo", "receipt = hóa đơn", "defective = bị lỗi", "full refund = hoàn tiền đầy đủ", "exchange = đổi hàng"]
    },
    {
      id: "project-deadline",
      level: "easy",
      title: "Project Deadline",
      description: "Chủ đề: hoàn thiện bài thuyết trình trước hạn chót.",
      lines: [
        ["A: Maria, how is the client presentation coming along?", "A: Maria, bài thuyết trình cho khách hàng tiến triển thế nào rồi?"],
        ["B: It's nearly finished. I just need to revise the introduction and add the updated budget figures.", "B: Gần xong rồi. Tôi chỉ cần chỉnh phần mở đầu và thêm số liệu ngân sách đã cập nhật."],
        ["A: Good. The deadline is tomorrow morning, so we should review everything before the end of the day.", "A: Tốt. Hạn chót là sáng mai, nên chúng ta nên xem lại mọi thứ trước cuối ngày."],
        ["B: I agree. I'll send you the latest version by 3 p.m.", "B: Tôi đồng ý. Tôi sẽ gửi anh/chị phiên bản mới nhất trước 3 giờ chiều."],
        ["A: Perfect. I'll check the slides for clarity and make sure the main points are easy to follow.", "A: Hoàn hảo. Tôi sẽ kiểm tra slide để đảm bảo rõ ràng và các ý chính dễ theo dõi."],
        ["B: Thanks. Once you give me your feedback, I'll make the final adjustments.", "B: Cảm ơn. Sau khi nhận phản hồi, tôi sẽ thực hiện các chỉnh sửa cuối cùng."]
      ],
      vocab: ["coming along = tiến triển thế nào", "nearly finished = gần hoàn thành", "revise = chỉnh sửa", "updated budget figures = số liệu ngân sách đã cập nhật", "clarity = sự rõ ràng", "final adjustments = chỉnh sửa cuối cùng"]
    },
    {
      id: "office-renovation",
      level: "medium",
      title: "Memo - Office Renovation",
      description: "Chủ đề: thông báo lịch sửa sảnh chính.",
      lines: [
        ["To: All Staff", "Gửi: Toàn thể nhân viên"],
        ["From: Facilities Department", "Từ: Bộ phận Cơ sở vật chất"],
        ["Subject: Lobby Renovation Schedule", "Chủ đề: Lịch sửa chữa sảnh chính"],
        ["Please be advised that renovation work in the main lobby will begin on Monday, June 8.", "Xin lưu ý rằng công việc sửa chữa tại sảnh chính sẽ bắt đầu vào thứ Hai, ngày 8 tháng 6."],
        ["During the first week, the front entrance will be temporarily closed, and employees should use the side entrance near the parking area.", "Trong tuần đầu tiên, lối vào phía trước sẽ tạm thời đóng, và nhân viên nên dùng lối bên cạnh khu vực đậu xe."],
        ["Visitors must check in at the temporary reception desk on the second floor.", "Khách đến phải làm thủ tục tại quầy lễ tân tạm thời ở tầng hai."],
        ["We apologize for any inconvenience and appreciate your cooperation.", "Chúng tôi xin lỗi vì bất kỳ bất tiện nào và cảm ơn sự hợp tác của quý vị."]
      ],
      vocab: ["renovation = sửa chữa/cải tạo", "temporarily = tạm thời", "check in = làm thủ tục/báo có mặt", "inconvenience = sự bất tiện", "cooperation = sự hợp tác", "Please be advised that... = Xin lưu ý rằng..."]
    },
    {
      id: "delayed-shipment-email",
      level: "medium",
      title: "Email - Delayed Shipment",
      description: "Chủ đề: email thông báo đơn hàng bị trễ.",
      lines: [
        ["Subject: Update on Order #4582", "Chủ đề: Cập nhật về đơn hàng #4582"],
        ["Dear Ms. Carter,", "Kính gửi bà Carter,"],
        ["We regret to inform you that your recent order has been delayed due to an unexpected shortage at our distribution center.", "Chúng tôi rất tiếc phải thông báo rằng đơn hàng gần đây của bà bị trì hoãn do tình trạng thiếu hàng ngoài dự kiến tại trung tâm phân phối."],
        ["The items are now expected to ship by Friday, and we will send you a tracking number as soon as they leave our warehouse.", "Các mặt hàng hiện dự kiến được gửi đi trước thứ Sáu, và chúng tôi sẽ gửi mã theo dõi ngay khi hàng rời kho."],
        ["As a courtesy, we have waived the delivery fee.", "Như một sự hỗ trợ thiện chí, chúng tôi đã miễn phí giao hàng."],
        ["Sincerely, Customer Support Team", "Trân trọng, Đội ngũ Hỗ trợ Khách hàng"]
      ],
      vocab: ["regret to inform = rất tiếc phải thông báo", "shortage = sự thiếu hụt", "distribution center = trung tâm phân phối", "warehouse = kho hàng", "waive the fee = miễn phí", "As a courtesy... = Như một sự hỗ trợ/thiện chí..."]
    },
    {
      id: "training-workshop",
      level: "medium",
      title: "Notice - Training Workshop",
      description: "Chủ đề: thông báo workshop phát triển chuyên môn.",
      lines: [
        ["Professional Development Workshop", "Hội thảo Phát triển Chuyên môn"],
        ["A two-hour workshop on effective client communication will be held next Tuesday in Room 405.", "Một hội thảo kéo dài hai giờ về giao tiếp hiệu quả với khách hàng sẽ được tổ chức vào thứ Ba tới tại Phòng 405."],
        ["The session will cover email etiquette, phone call strategies, and techniques for handling difficult customers.", "Buổi học sẽ bao gồm phép lịch sự trong email, chiến lược gọi điện và kỹ thuật xử lý khách hàng khó tính."],
        ["Employees who work directly with clients are strongly encouraged to attend.", "Nhân viên làm việc trực tiếp với khách hàng được khuyến khích mạnh mẽ tham dự."],
        ["Registration closes at 5 p.m. on Friday.", "Hạn đăng ký kết thúc lúc 5 giờ chiều thứ Sáu."]
      ],
      vocab: ["professional development = phát triển chuyên môn", "etiquette = phép lịch sự/quy tắc ứng xử", "handle difficult customers = xử lý khách hàng khó tính", "encouraged to attend = được khuyến khích tham dự", "Registration closes at... = Hạn đăng ký kết thúc lúc..."]
    },
    {
      id: "local-business-cafe",
      level: "medium",
      title: "Short Article - Local Business",
      description: "Chủ đề: bài báo ngắn về quán cà phê mới.",
      lines: [
        ["New Cafe Opens Near Central Station", "Quán cà phê mới mở gần Ga Trung tâm"],
        ["A locally owned cafe has opened across from Central Station, offering commuters a convenient place to grab breakfast and coffee before work.", "Một quán cà phê do người địa phương sở hữu đã mở đối diện Ga Trung tâm, mang đến cho người đi làm một nơi tiện lợi để mua bữa sáng và cà phê trước giờ làm."],
        ["The owner, Maria Lopez, says the shop focuses on fresh pastries, quick service, and reasonable prices.", "Chủ quán, Maria Lopez, cho biết cửa hàng tập trung vào bánh ngọt tươi, phục vụ nhanh và giá cả hợp lý."],
        ["To attract first-time customers, the cafe is offering a 20 percent discount throughout its opening week.", "Để thu hút khách hàng lần đầu, quán đang giảm giá 20 phần trăm trong suốt tuần khai trương."]
      ],
      vocab: ["locally owned = do người địa phương sở hữu", "commuter = người đi làm/đi học hằng ngày", "reasonable prices = giá cả hợp lý", "first-time customers = khách hàng lần đầu", "To attract first-time customers... = Để thu hút khách hàng lần đầu..."]
    },
    {
      id: "remote-work-policy",
      level: "medium",
      title: "Memo - Policy Update",
      description: "Chủ đề: cập nhật chính sách làm việc từ xa.",
      lines: [
        ["To: Department Managers", "Gửi: Các trưởng bộ phận"],
        ["Subject: Updated Remote Work Policy", "Chủ đề: Chính sách làm việc từ xa đã cập nhật"],
        ["Starting July 1, employees may work remotely up to two days per week, provided that their supervisors approve the arrangement in advance.", "Bắt đầu từ ngày 1 tháng 7, nhân viên có thể làm việc từ xa tối đa hai ngày mỗi tuần, với điều kiện cấp trên phê duyệt sắp xếp này trước."],
        ["Team meetings should continue to be held in person whenever possible.", "Các cuộc họp nhóm vẫn nên được tổ chức trực tiếp khi có thể."],
        ["Managers are responsible for ensuring that productivity and communication remain consistent.", "Quản lý chịu trách nhiệm đảm bảo năng suất và giao tiếp được duy trì ổn định."]
      ],
      vocab: ["remotely = từ xa", "provided that = với điều kiện là", "arrangement = sự sắp xếp", "in advance = trước", "productivity = năng suất"]
    },
    {
      id: "office-chairs-ad",
      level: "medium",
      title: "Advertisement - Office Chairs",
      description: "Chủ đề: quảng cáo ghế văn phòng.",
      lines: [
        ["ErgoPro Office Chairs", "Ghế văn phòng ErgoPro"],
        ["Upgrade your workspace with ErgoPro's newest ergonomic chair.", "Nâng cấp không gian làm việc của bạn với mẫu ghế công thái học mới nhất của ErgoPro."],
        ["Designed for long workdays, it features adjustable armrests, breathable fabric, and enhanced lower-back support.", "Được thiết kế cho những ngày làm việc dài, ghế có tay vịn điều chỉnh được, vải thoáng khí và hỗ trợ lưng dưới cải tiến."],
        ["Corporate discounts are available for orders of ten or more units.", "Ưu đãi doanh nghiệp áp dụng cho đơn hàng từ mười chiếc trở lên."],
        ["Visit our showroom this week for a free consultation.", "Hãy ghé phòng trưng bày của chúng tôi trong tuần này để được tư vấn miễn phí."]
      ],
      vocab: ["ergonomic = công thái học", "adjustable = có thể điều chỉnh", "breathable fabric = vải thoáng khí", "enhanced support = hỗ trợ cải tiến", "consultation = buổi tư vấn", "orders of ten or more units = đơn hàng từ 10 chiếc trở lên"]
    },
    {
      id: "schedule-revision",
      level: "medium",
      title: "Announcement - Schedule Revision",
      description: "Chủ đề: thông báo thay đổi lịch tàu.",
      lines: [
        ["Attention Passengers", "Kính gửi hành khách"],
        ["Due to maintenance work on the eastbound rail line, several morning trains will operate on a revised schedule this weekend.", "Do công tác bảo trì trên tuyến đường sắt hướng đông, một số chuyến tàu buổi sáng sẽ chạy theo lịch điều chỉnh vào cuối tuần này."],
        ["Passengers traveling between Hillview and Eastport should allow an additional twenty minutes for their journey.", "Hành khách đi giữa Hillview và Eastport nên dự trù thêm hai mươi phút cho hành trình."],
        ["Updated timetables are available at all ticket counters and on the company website.", "Lịch trình cập nhật có tại tất cả quầy vé và trên trang web của công ty."]
      ],
      vocab: ["maintenance work = công tác bảo trì", "revised schedule = lịch điều chỉnh", "allow additional time = dự trù thêm thời gian", "timetable = thời gian biểu", "should allow an additional twenty minutes = nên dự trù thêm 20 phút"]
    },
    {
      id: "corporate-strategy",
      level: "hard",
      title: "Corporate Strategy",
      description: "Chủ đề: chiến lược tái định vị doanh nghiệp.",
      lines: [
        ["The company is not merely trying to expand; it is repositioning itself in a crowded market where customer loyalty can no longer be taken for granted.", "Công ty không chỉ đơn thuần cố gắng mở rộng; họ đang tái định vị mình trong một thị trường đông đúc, nơi lòng trung thành của khách hàng không còn là điều có thể mặc nhiên có được."],
        ["By streamlining internal workflows, investing in data-driven decision-making, and sharpening its brand message, the firm hopes to move from short-term growth to sustainable relevance.", "Bằng cách tinh gọn quy trình nội bộ, đầu tư vào việc ra quyết định dựa trên dữ liệu và làm sắc nét thông điệp thương hiệu, công ty hy vọng chuyển từ tăng trưởng ngắn hạn sang sự phù hợp bền vững."]
      ],
      vocab: ["reposition itself = tái định vị", "crowded market = thị trường đông đúc", "taken for granted = được xem là hiển nhiên", "streamlining workflows = tinh gọn quy trình", "data-driven decision-making = ra quyết định dựa trên dữ liệu", "sustainable relevance = sự phù hợp bền vững"]
    },
    {
      id: "workplace-culture",
      level: "hard",
      title: "Workplace Culture",
      description: "Chủ đề: văn hóa làm việc dựa trên niềm tin.",
      lines: [
        ["A productive workplace is rarely built on rigid rules alone.", "Một nơi làm việc hiệu quả hiếm khi chỉ được xây dựng trên các quy định cứng nhắc."],
        ["It depends on mutual trust, clear expectations, and the quiet confidence that employees can raise concerns without being dismissed.", "Nó phụ thuộc vào sự tin tưởng lẫn nhau, kỳ vọng rõ ràng và niềm tin âm thầm rằng nhân viên có thể nêu mối lo mà không bị gạt bỏ."],
        ["When managers listen before reacting, small problems are often resolved before they become expensive failures.", "Khi quản lý lắng nghe trước khi phản ứng, các vấn đề nhỏ thường được giải quyết trước khi trở thành sai lầm tốn kém."]
      ],
      vocab: ["rigid rules = quy định cứng nhắc", "mutual trust = sự tin tưởng lẫn nhau", "clear expectations = kỳ vọng rõ ràng", "raise concerns = nêu mối lo", "be dismissed = bị gạt bỏ", "listen before reacting = lắng nghe trước khi phản ứng"]
    },
    {
      id: "customer-experience",
      level: "hard",
      title: "Customer Experience",
      description: "Chủ đề: trải nghiệm khách hàng và danh tiếng thương hiệu.",
      lines: [
        ["Customers do not always remember the technical details of a product, but they remember how effortless the experience felt.", "Khách hàng không phải lúc nào cũng nhớ các chi tiết kỹ thuật của sản phẩm, nhưng họ nhớ trải nghiệm đó dễ dàng đến mức nào."],
        ["A delayed response, a confusing return policy, or a careless handoff between departments can quietly damage a brand's reputation.", "Một phản hồi chậm, chính sách đổi trả khó hiểu hoặc sự bàn giao cẩu thả giữa các bộ phận có thể âm thầm làm tổn hại danh tiếng thương hiệu."],
        ["In competitive industries, convenience is no longer a bonus; it is the baseline.", "Trong các ngành cạnh tranh, sự tiện lợi không còn là điểm cộng; nó là tiêu chuẩn tối thiểu."]
      ],
      vocab: ["effortless experience = trải nghiệm dễ dàng", "delayed response = phản hồi chậm", "return policy = chính sách đổi trả", "careless handoff = bàn giao cẩu thả", "damage a brand's reputation = làm tổn hại danh tiếng thương hiệu", "baseline = tiêu chuẩn tối thiểu"]
    },
    {
      id: "business-travel",
      level: "hard",
      title: "Business Travel",
      description: "Chủ đề: đi công tác như một khoản đầu tư có cân nhắc.",
      lines: [
        ["Business travel has changed from a routine obligation into a carefully weighed investment.", "Đi công tác đã thay đổi từ một nghĩa vụ thường lệ thành một khoản đầu tư được cân nhắc kỹ."],
        ["Companies now ask whether a trip will genuinely strengthen a partnership, accelerate a deal, or solve a problem that cannot be handled remotely.", "Các công ty giờ đây đặt câu hỏi liệu chuyến đi có thật sự củng cố quan hệ đối tác, thúc đẩy một thương vụ hoặc giải quyết vấn đề không thể xử lý từ xa hay không."],
        ["The best trips are no longer the longest ones, but the ones with a clear purpose and measurable value.", "Những chuyến đi tốt nhất không còn là những chuyến dài nhất, mà là những chuyến có mục đích rõ ràng và giá trị đo lường được."]
      ],
      vocab: ["routine obligation = nghĩa vụ thường lệ", "carefully weighed investment = khoản đầu tư được cân nhắc kỹ", "strengthen a partnership = củng cố quan hệ đối tác", "accelerate a deal = thúc đẩy thương vụ", "measurable value = giá trị đo lường được"]
    },
    {
      id: "leadership",
      level: "hard",
      title: "Leadership",
      description: "Chủ đề: lãnh đạo bằng định hướng và sự bình tĩnh.",
      lines: [
        ["Strong leadership is less about having the loudest voice in the room and more about setting a tone that others can trust.", "Lãnh đạo mạnh mẽ không hẳn là có tiếng nói lớn nhất trong phòng, mà đúng hơn là tạo ra một phong thái khiến người khác tin tưởng."],
        ["A good leader clarifies priorities, absorbs pressure without spreading panic, and gives people enough direction to move quickly without feeling micromanaged.", "Một lãnh đạo tốt làm rõ ưu tiên, hấp thụ áp lực mà không lan truyền hoảng loạn, và đưa ra đủ định hướng để mọi người hành động nhanh mà không cảm thấy bị quản lý vi mô."]
      ],
      vocab: ["set a tone = tạo phong thái/định hướng", "clarify priorities = làm rõ ưu tiên", "absorb pressure = chịu/hấp thụ áp lực", "spreading panic = lan truyền hoảng loạn", "micromanaged = bị quản lý quá chi tiết", "less about... and more about... = không hẳn là..., mà đúng hơn là..."]
    }
  ];

  if (typeof window !== "undefined") {
    window.READING_LESSONS_FALLBACK = READING_LESSONS_FALLBACK;
  }
})();
