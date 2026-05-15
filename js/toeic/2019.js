// TOEIC Reading 2019 data.
window.TOEIC_READING_EXAMS = window.TOEIC_READING_EXAMS || {};

(() => {
  const questions = [];
  const add = (partNumber, questionNo, question, options, answer, passage = null, group = null) => {
    questions.push({
      partNumber,
      questionNo,
      ...(group ? { group } : {}),
      ...(passage ? { passage } : {}),
      question,
      options,
      answer,
      explain: "Correct answer from the supplied 2019 answer key."
    });
  };

  [
    [101, "The accounting department will not process reimbursement forms ------- they are accompanied by original receipts.", ["unless", "despite", "whereas", "whether"], "unless"],
    [102, "The new inventory system has made it easier for warehouse staff to locate items -------.", ["accuracy", "accurate", "accurately", "accuracies"], "accurately"],
    [103, "Ms. Carter asked that the final version of the brochure ------- sent to the printer by Thursday afternoon.", ["be", "is", "was", "has been"], "be"],
    [104, "The product development team is ------- confident that the prototype will be ready for testing next month.", ["high", "highly", "height", "higher"], "highly"],
    [105, "The training room can accommodate up to forty participants, ------- makes it suitable for large workshops.", ["which", "what", "who", "whose"], "which"],
    [106, "The contract was reviewed carefully ------- any changes were approved.", ["before", "during", "since", "while"], "before"],
    [107, "Customers are advised to check product availability online before ------- to the store.", ["travel", "traveled", "traveling", "travels"], "traveling"],
    [108, "The branch manager praised the team for handling the unexpected increase in orders so -------.", ["efficient", "efficiency", "efficiently", "efficiencies"], "efficiently"],
    [109, "The supplier agreed to provide replacement parts at no ------- cost.", ["addition", "additional", "additionally", "additions"], "additional"],
    [110, "------- the software update is complete, employees should not turn off their computers.", ["Until", "Although", "Because of", "In spite of"], "Until"],
    [111, "The company’s decision to expand into overseas markets was based on a ------- analysis of consumer demand.", ["thorough", "thoroughly", "thoroughness", "more thoroughness"], "thorough"],
    [112, "The hotel offers complimentary breakfast to guests ------- reservations include at least two nights.", ["who", "whom", "whose", "which"], "whose"],
    [113, "All visitors must present photo identification ------- receiving a temporary access card.", ["prior to", "instead of", "even though", "regardless"], "prior to"],
    [114, "The customer survey results were ------- positive, especially regarding delivery speed.", ["overwhelming", "overwhelmingly", "overwhelm", "overwhelmed"], "overwhelmingly"],
    [115, "The marketing director requested ------- copies of the presentation for the board meeting.", ["addition", "additional", "additionally", "additions"], "additional"],
    [116, "Because the keynote speaker’s flight was delayed, the opening session began ------- than scheduled.", ["late", "later", "lately", "lateness"], "later"],
    [117, "The maintenance team ------- the elevator twice before declaring it safe for use.", ["inspected", "inspection", "inspector", "inspecting"], "inspected"],
    [118, "Employees may use the company gym ------- they complete the safety orientation first.", ["as long as", "as far as", "as many as", "as soon"], "as long as"],
    [119, "The conference organizer sent a reminder to ------- who had not yet confirmed their attendance.", ["those", "them", "their", "these"], "those"],
    [120, "The new packaging design is expected to make the product more ------- to younger consumers.", ["appeal", "appealing", "appealed", "appeals"], "appealing"],
    [121, "The finance committee will meet next week to discuss ------- the proposed budget should be revised.", ["whether", "while", "despite", "during"], "whether"],
    [122, "The company has ------- increased its investment in employee training over the past three years.", ["steady", "steadily", "steadiness", "steadied"], "steadily"],
    [123, "The restaurant’s outdoor seating area will remain closed ------- the renovation work is finished.", ["until", "among", "over", "within"], "until"],
    [124, "The receptionist asked the courier to leave the package ------- the front desk.", ["in", "at", "on", "among"], "at"],
    [125, "The online payment system was designed to ------- transactions more securely.", ["process", "processing", "processed", "procession"], "process"],
    [126, "Several employees attended the workshop, ------- focused on improving communication with clients.", ["which", "who", "whom", "whose"], "which"],
    [127, "The company chose the downtown location because it is ------- accessible by public transportation.", ["easy", "ease", "easily", "easier"], "easily"],
    [128, "------- completing the online form, applicants will receive a confirmation e-mail.", ["Upon", "Despite", "Unless", "About"], "Upon"],
    [129, "The revised proposal is ------- more detailed than the original version.", ["considerably", "considerable", "consideration", "considering"], "considerably"],
    [130, "The warehouse supervisor reminded staff to handle fragile items with -------.", ["care", "careful", "carefully", "caring"], "care"]
  ].forEach(([no, question, options, answer]) => add("5", no, question, options, answer));

  const text1 = `E-mail

To: All Employees
From: Information Technology Department
Subject: Password Security Update

Dear Employees,

Beginning Monday, all staff members will be required to update their network passwords every ninety days. This change is part of our ongoing effort to protect company data and reduce the risk of unauthorized access.

When creating a new password, please use at least twelve characters, including uppercase letters, lowercase letters, numbers, and symbols. Passwords should not contain personal information that can be easily ------- (131), such as birthdays or employee names.

The system will automatically remind you seven days before your password expires. ------- (132), you may update your password earlier by selecting “Account Settings” on the company intranet.

------- (133) If you experience difficulty logging in after the update, contact the help desk at extension 4488.

Thank you for helping us maintain a secure digital workplace.`;
  add("6", 131, "Choose the best answer for blank 131.", ["guessed", "guess", "guessing", "guesses"], "guessed", text1, "Text 1");
  add("6", 132, "Choose the best answer for blank 132.", ["However", "In addition", "Instead", "For example"], "In addition", text1, "Text 1");
  add("6", 133, "Choose the sentence that best completes blank 133.", ["The cafeteria will begin serving breakfast next week.", "Please do not share your password with anyone.", "The sales department exceeded its quarterly target.", "Parking permits may be renewed online."], "Please do not share your password with anyone.", text1, "Text 1");
  add("6", 134, "What is the purpose of the e-mail?", ["To announce a new password policy", "To report a network failure", "To introduce a new intranet design", "To explain how to order computer equipment"], "To announce a new password policy", text1, "Text 1");

  const text2 = `Notice

Temporary Change to Delivery Hours

Due to road repairs near our main distribution center, delivery hours will be temporarily changed from April 3 to April 14. During this period, deliveries to downtown addresses will be made between 10:00 A.M. and 6:00 P.M., rather than the usual 8:00 A.M. to 4:00 P.M.

Customers who need early-morning deliveries should contact customer service at least two business days ------- (135). We will try to make alternate arrangements when possible.

This change is expected to affect only downtown deliveries. ------- (136), deliveries to suburban areas will continue on the regular schedule.

------- (137) We apologize for any inconvenience and appreciate your patience during the roadwork.`;
  add("6", 135, "Choose the best answer for blank 135.", ["in advance", "by contrast", "on purpose", "at random"], "in advance", text2, "Text 2");
  add("6", 136, "Choose the best answer for blank 136.", ["As a result", "In contrast", "For instance", "Otherwise"], "In contrast", text2, "Text 2");
  add("6", 137, "Choose the sentence that best completes blank 137.", ["Customers may still track orders through our Web site.", "The company will permanently close its distribution center.", "Road repairs were completed last month.", "All suburban deliveries have been canceled."], "Customers may still track orders through our Web site.", text2, "Text 2");
  add("6", 138, "What is indicated about the delivery change?", ["It applies to all customers worldwide.", "It is related to road repairs.", "It will last for one day only.", "It eliminates online order tracking."], "It is related to road repairs.", text2, "Text 2");

  const text3 = `Article

Harbor Café Introduces Waste-Reduction Program

Harbor Café has launched a waste-reduction program aimed at lowering the amount of disposable packaging used by the restaurant. Customers who bring their own reusable cups will receive a 10 percent discount on coffee and tea beverages.

According to owner Miguel Santos, the idea was ------- (139) by customer suggestions and by the café’s desire to operate more sustainably. “We use hundreds of paper cups each week,” Santos said. “Even a small change can make a meaningful difference.”

The café will also begin using compostable containers for takeout meals. ------- (140), it plans to donate unsold baked goods to a local food charity every evening.

------- (141) Harbor Café expects the program to reduce disposable waste by at least 25 percent within six months.`;
  add("6", 139, "Choose the best answer for blank 139.", ["inspire", "inspired", "inspiring", "inspiration"], "inspired", text3, "Text 3");
  add("6", 140, "Choose the best answer for blank 140.", ["Therefore", "In addition", "Nevertheless", "Otherwise"], "In addition", text3, "Text 3");
  add("6", 141, "Choose the sentence that best completes blank 141.", ["The restaurant recently expanded its seating area.", "The discount applies only to reusable cups.", "The café will stop selling coffee next month.", "Customers must pay extra for paper cups."], "The discount applies only to reusable cups.", text3, "Text 3");
  add("6", 142, "What is the article mainly about?", ["A café’s environmental initiative", "A new bakery product", "A restaurant relocation", "A change in employee uniforms"], "A café’s environmental initiative", text3, "Text 3");

  const text4 = `E-mail

To: Jennifer Walsh
From: Aaron Bell
Subject: Conference Presentation Materials

Dear Ms. Walsh,

Thank you for agreeing to speak at the Metro Business Leadership Conference on May 22. We are pleased to include your presentation, “Building Strong Client Relationships,” in the afternoon program.

To ensure that the conference booklet can be printed on time, please send a short biography and a summary of your presentation by April 28. These materials will be included in the booklet distributed to all attendees.

If you plan to use slides, please submit them by May 15 so our technical team can test the equipment ------- (143). We recommend using a standard file format to avoid compatibility issues.

------- (144), speakers should check in at the registration desk at least thirty minutes before their sessions.

------- (145) We look forward to welcoming you to the conference.

Sincerely,
Aaron Bell
Program Coordinator`;
  add("6", 143, "Choose the best answer for blank 143.", ["ahead of time", "instead of it", "by mistake", "in writing"], "ahead of time", text4, "Text 4");
  add("6", 144, "Choose the best answer for blank 144.", ["Additionally", "Instead", "Even though", "Unless"], "Additionally", text4, "Text 4");
  add("6", 145, "Choose the sentence that best completes blank 145.", ["Please attach your travel receipts to the expense form.", "A map of the venue is attached for your convenience.", "The conference has been postponed until next year.", "Your presentation was removed from the program."], "A map of the venue is attached for your convenience.", text4, "Text 4");
  add("6", 146, "Why should Ms. Walsh send her slides by May 15?", ["So they can be printed in the conference booklet", "So the technical team can test the equipment", "So attendees can review them before registering", "So the program coordinator can translate them"], "So the technical team can test the equipment", text4, "Text 4");

  const addBlock = (group, passage, items) => items.forEach(([no, question, options, answer]) => add("7", no, question, options, answer, passage, group));

  addBlock("Single Passage 1", `Notice

Office Kitchen Renovation

The employee kitchen on the third floor will be closed from Monday, June 10, through Friday, June 14, while new cabinets and energy-efficient appliances are installed. During the renovation, employees may use the kitchen on the fifth floor.

Because refrigerator space on the fifth floor is limited, employees are asked to bring only small lunch items during the renovation period. Coffee and tea service will be temporarily available in Conference Room 3B each morning from 8:00 A.M. to 10:00 A.M.

Facilities Department`, [
    [147, "What is the purpose of the notice?", ["To announce a kitchen renovation", "To introduce a new cafeteria menu", "To change conference room reservations", "To request volunteers for cleaning"], "To announce a kitchen renovation"],
    [148, "Where can employees prepare food during the renovation?", ["In Conference Room 3B", "In the fifth-floor kitchen", "At the reception desk", "In the basement cafeteria"], "In the fifth-floor kitchen"],
    [149, "Why are employees asked to bring only small lunch items?", ["Refrigerator space is limited.", "The company is reducing lunch breaks.", "Outside food is no longer allowed.", "The third-floor kitchen will become smaller."], "Refrigerator space is limited."],
    [150, "What will be available in Conference Room 3B?", ["New cabinets", "Refrigerator storage", "Coffee and tea service", "Cooking classes"], "Coffee and tea service"]
  ]);

  addBlock("Single Passage 2", `E-mail

To: Customer Service Department
From: Rachel Nguyen, Customer Service Manager
Subject: Updated Call Script

Team,

Starting tomorrow, please use the updated call script when responding to customers asking about delayed shipments. The new script includes clearer instructions for checking order status, explaining delivery estimates, and offering a shipping-fee refund when appropriate.

You can find the script in the shared folder labeled “Customer Support Resources.” Please review it before your shift begins. I will listen to several recorded calls next week to make sure the new process is being followed consistently.

Thank you for your attention to this update.

Rachel`, [
    [151, "What is the e-mail mainly about?", ["A new customer call procedure", "A change in employee shifts", "A problem with recorded calls", "A new product return policy"], "A new customer call procedure"],
    [152, "What issue does the updated script address?", ["Product discounts", "Delayed shipments", "Damaged office furniture", "Password resets"], "Delayed shipments"],
    [153, "Where can employees find the script?", ["In the training room", "In a shared folder", "On the company bulletin board", "At the reception desk"], "In a shared folder"],
    [154, "What will Rachel do next week?", ["Process shipping-fee refunds", "Visit customer locations", "Listen to recorded calls", "Update the delivery schedule"], "Listen to recorded calls"]
  ]);

  addBlock("Single Passage 3", `Advertisement

MetroPoint Meeting Suites

Need a professional space for client meetings, interviews, or workshops? MetroPoint Meeting Suites offers fully equipped rooms in the downtown business district.

Each room includes high-speed Internet, a projector, whiteboards, and complimentary coffee service. Rooms may be reserved by the hour, half day, or full day. Catering is available through our partner restaurants with at least 48 hours’ notice.

Book before July 31 and receive 20 percent off your first reservation. Visit www.metropointsuites.com to check availability.`, [
    [155, "What is being advertised?", ["Business meeting rooms", "Office cleaning services", "Restaurant equipment", "Interview training courses"], "Business meeting rooms"],
    [156, "What is included with each room?", ["Overnight lodging", "Complimentary coffee service", "Free lunch catering", "Printing equipment"], "Complimentary coffee service"],
    [157, "What is required for catering?", ["A full-day room reservation", "At least 48 hours’ notice", "A membership account", "Payment in cash"], "At least 48 hours’ notice"],
    [158, "How can customers receive 20 percent off?", ["By reserving before July 31", "By booking three rooms", "By ordering catering", "By attending a workshop"], "By reserving before July 31"]
  ]);

  addBlock("Single Passage 4", `Text-Message Chain

Owen: Hi, Maya. Did the replacement banners arrive for tomorrow’s trade show?
Maya: They arrived this morning, but one of them has the old company logo.
Owen: That is a problem. The display booth opens at 9:00 A.M. tomorrow.
Maya: I already called the print shop. They can reprint it by 5:00 P.M. today if we send the corrected file now.
Owen: Great. I’ll send the file in the next five minutes. Can you pick up the banner after work?
Maya: Yes, I’ll go there before they close.`, [
    [159, "What problem does Maya report?", ["A banner has an outdated logo.", "The trade show was postponed.", "The print shop is closed today.", "The display booth was damaged."], "A banner has an outdated logo."],
    [160, "When does the display booth open?", ["At 5:00 P.M. today", "At 9:00 A.M. tomorrow", "In five minutes", "After work tomorrow"], "At 9:00 A.M. tomorrow"],
    [161, "What will Owen do?", ["Pick up the banner", "Call the trade show organizer", "Send the corrected file", "Replace the display booth"], "Send the corrected file"],
    [162, "What can be inferred about Maya?", ["She works at the print shop.", "She will pick up the corrected banner.", "She designed the old company logo.", "She cannot attend the trade show."], "She will pick up the corrected banner."]
  ]);

  addBlock("Single Passage 5", `Article

Local Manufacturer Receives Safety Award

Everton Components, a manufacturer of electronic parts, has received the Regional Workplace Safety Award for the second consecutive year. The award recognizes companies that maintain low accident rates and provide regular safety training for employees.

According to plant manager Serena Holt, Everton reduced workplace incidents by 18 percent last year after introducing monthly equipment inspections and refresher training for machine operators.

The company plans to invest in additional protective equipment this summer and expand its safety training program to include warehouse staff.`, [
    [163, "What is Everton Components?", ["A manufacturer of electronic parts", "A regional training school", "A safety inspection agency", "A warehouse design company"], "A manufacturer of electronic parts"],
    [164, "Why did Everton receive the award?", ["It opened a new warehouse.", "It maintained strong workplace safety practices.", "It developed a new electronic product.", "It hired a new plant manager."], "It maintained strong workplace safety practices."],
    [165, "What helped Everton reduce workplace incidents?", ["Longer employee shifts", "Monthly equipment inspections", "A new cafeteria policy", "Reduced production hours"], "Monthly equipment inspections"],
    [166, "What does the company plan to do this summer?", ["Move to another region", "Increase accident rates", "Invest in protective equipment", "Stop safety training"], "Invest in protective equipment"]
  ]);

  addBlock("Single Passage 6", `Schedule

Northside Community College — Evening Business Courses

Course | Start Date | Time | Instructor | Fee
Introduction to Accounting | Sept. 4 | Mondays, 6:00–8:30 P.M. | Victor Lane | $180
Business Writing Workshop | Sept. 6 | Wednesdays, 6:30–8:30 P.M. | Allison Reed | $150
Excel for Office Professionals | Sept. 7 | Thursdays, 6:00–9:00 P.M. | Priya Shah | $210
Supervisory Skills | Sept. 12 | Tuesdays, 7:00–9:00 P.M. | Martin Cole | $165

Registration closes one week before each course begins. Students who register for two or more courses receive a 10 percent discount on total fees.`, [
    [167, "Which course is taught by Priya Shah?", ["Introduction to Accounting", "Business Writing Workshop", "Excel for Office Professionals", "Supervisory Skills"], "Excel for Office Professionals"],
    [168, "Which course begins on September 12?", ["Introduction to Accounting", "Business Writing Workshop", "Excel for Office Professionals", "Supervisory Skills"], "Supervisory Skills"],
    [169, "What is stated about registration?", ["It closes one week before each course begins.", "It is available only on Mondays.", "It requires instructor approval.", "It closes after the first class meeting."], "It closes one week before each course begins."],
    [170, "How can students receive a discount?", ["By registering online", "By taking two or more courses", "By paying in cash", "By attending every class"], "By taking two or more courses"]
  ]);

  addBlock("Single Passage 7", `Memo

To: All Sales Representatives
From: Daniel Kim, Sales Director
Subject: Client Visit Reports

Beginning next month, all sales representatives must submit client visit reports within 24 hours of each meeting. Reports should include the client’s main concerns, potential sales opportunities, and any follow-up actions required.

The new reporting form is available in the sales portal. Please use the drop-down menu to select the appropriate client category. If a client does not fit an existing category, choose “Other” and provide a brief explanation.

These reports will help managers identify common customer needs and coordinate support across regions.`, [
    [171, "What is the memo mainly about?", ["A new reporting requirement", "A sales conference schedule", "A change in client categories only", "A regional hiring plan"], "A new reporting requirement"],
    [172, "When must reports be submitted?", ["Before each client meeting", "Within 24 hours of each meeting", "At the end of each month", "After managers request them"], "Within 24 hours of each meeting"],
    [173, "Where is the new form available?", ["In the sales portal", "At the front desk", "In printed binders only", "On a public Web site"], "In the sales portal"],
    [174, "Why are the reports needed?", ["To reduce the number of sales meetings", "To identify common customer needs", "To replace client contracts", "To evaluate office furniture"], "To identify common customer needs"]
  ]);

  addBlock("Double Passage 1", `E-mail and Reply

E-mail

To: Reservations, Hillcrest Hotel
From: Laura Bennett
Subject: Room Block Inquiry

Dear Reservations Team,

Our company will hold a three-day leadership retreat in your city from October 9 to October 11. We expect approximately 32 employees to attend and would like to reserve a block of guest rooms for the nights of October 8, 9, and 10.

Could you let me know whether you have at least 20 rooms available for those nights? We would also like to use a small meeting room on the morning of October 9 for an opening session.

Sincerely,
Laura Bennett

Reply

Dear Ms. Bennett,

Thank you for contacting Hillcrest Hotel. We currently have 24 standard rooms available for the nights you requested. We can hold these rooms until August 15 without a deposit.

Our Cedar Room is available from 8:00 A.M. to noon on October 9 and can accommodate up to 35 people. The room includes a projector and wireless Internet access.

Please let us know if you would like us to prepare a formal proposal.

Best regards,
Nina Ford
Group Reservations Coordinator`, [
    [175, "What is Laura Bennett organizing?", ["A three-day leadership retreat", "A product launch", "A hotel renovation", "A family vacation"], "A three-day leadership retreat"],
    [176, "How many employees are expected to attend?", ["20", "24", "32", "35"], "32"],
    [177, "What does Laura ask about?", ["Airport transportation", "A room block and meeting space", "Restaurant reservations", "Laundry service"], "A room block and meeting space"],
    [178, "What is stated about the Cedar Room?", ["It is available all day on October 9.", "It can hold up to 35 people.", "It requires a deposit by August 15.", "It does not include Internet access."], "It can hold up to 35 people."],
    [179, "What can be inferred about the hotel?", ["It has enough standard rooms for Laura’s minimum request.", "It cannot host meetings in October.", "It requires payment before holding rooms.", "It has exactly 32 rooms available."], "It has enough standard rooms for Laura’s minimum request."]
  ]);

  addBlock("Double Passage 2", `Web Page and E-mail

Web Page

CityPrint Express — Same-Day Printing Services

CityPrint Express offers same-day printing for flyers, posters, and presentation handouts. Orders submitted before 11:00 A.M. are usually ready for pickup by 5:00 P.M. the same day.

Large-format posters cost $18 each. Presentation handouts cost $0.12 per page for black-and-white printing and $0.35 per page for color printing.

A 15 percent rush fee applies to orders requested in less than four hours.

E-mail

To: CityPrint Express
From: Marcus Hill
Subject: Printing Request

Hello,

I need six large-format posters printed for a client presentation tomorrow morning. I can send the files by 10:30 A.M. today and pick them up after 4:30 P.M.

Could you confirm whether the posters can be ready today and tell me the total cost? I do not need delivery.

Thank you,
Marcus Hill`, [
    [180, "What does CityPrint Express offer?", ["Same-day printing", "Office equipment rental", "Graphic design courses", "Document translation"], "Same-day printing"],
    [181, "What does Marcus need printed?", ["Flyers", "Presentation handouts", "Large-format posters", "Business cards"], "Large-format posters"],
    [182, "Why should Marcus’s order be ready the same day?", ["He is ordering more than ten items.", "He can submit the files before 11:00 A.M.", "He requested delivery.", "He is paying a rush fee."], "He can submit the files before 11:00 A.M."],
    [183, "What is the total cost before any rush fee?", ["$18", "$72", "$108", "$120"], "$108"],
    [184, "What can be inferred about Marcus’s order?", ["It should not require the rush fee.", "It must be delivered before noon.", "It cannot be completed by today.", "It includes color handouts."], "It should not require the rush fee."]
  ]);

  addBlock("Triple Passage 1", `Three Related Texts

Job Posting

Marketing Coordinator — Brookfield Home Goods

Brookfield Home Goods is seeking a marketing coordinator to assist with product launches, social media campaigns, and promotional events. Applicants should have at least two years of marketing experience and strong writing skills. Experience with photo-editing software is preferred.

Please submit a résumé, cover letter, and two writing samples by March 22.

E-mail

To: hiring@brookfieldhg.com
From: Elena Rossi
Subject: Marketing Coordinator Application

Dear Hiring Team,

I am applying for the marketing coordinator position. For the past three years, I have worked as a communications assistant at a regional furniture company, where I wrote product descriptions, managed weekly social media posts, and helped organize store events.

I have attached my résumé, cover letter, and two writing samples. I also have basic experience with photo-editing software, which I used to prepare images for online promotions.

Sincerely,
Elena Rossi

Internal Message

To: Paul Grant
From: Nadia Mills
Subject: Elena Rossi Application

Paul,

Elena Rossi appears to meet the main requirements for the marketing coordinator role. Her experience is closely related to our work, particularly her social media and event support background. She also included all required application materials.

I suggest inviting her for a first-round interview early next week.

Nadia`, [
    [185, "What position is being advertised?", ["Communications assistant", "Marketing coordinator", "Store manager", "Product photographer"], "Marketing coordinator"],
    [186, "What is required for applicants?", ["Five years of retail experience", "Two writing samples", "Advanced accounting skills", "A design certificate"], "Two writing samples"],
    [187, "Where does Elena currently work?", ["Brookfield Home Goods", "A regional furniture company", "A photo-editing software firm", "An event planning agency"], "A regional furniture company"],
    [188, "Which task has Elena performed in her current job?", ["Managing weekly social media posts", "Designing furniture", "Training marketing coordinators", "Reviewing job applications"], "Managing weekly social media posts"],
    [189, "What does Nadia say about Elena?", ["She failed to include writing samples.", "She lacks marketing-related experience.", "She appears to meet the main requirements.", "She should apply for a different position."], "She appears to meet the main requirements."],
    [190, "What will probably happen next?", ["Elena will be invited to interview.", "The job posting will be withdrawn.", "Paul will request a refund.", "Nadia will rewrite Elena’s cover letter."], "Elena will be invited to interview."]
  ]);

  addBlock("Triple Passage 2", `Three Related Texts

Advertisement

Lakeview Conference Center

Lakeview Conference Center offers meeting rooms for corporate training, seminars, and private business events. The Oak Hall seats up to 120 guests, while the Maple Room seats up to 60 guests. Each rental includes wireless Internet, a sound system, and a screen.

Catering packages are available for groups of 30 or more. Reservations made at least two months in advance receive a 10 percent discount on room rental fees.

E-mail

To: Lakeview Conference Center
From: Thomas Reed
Subject: Seminar Space

Hello,

I am planning a half-day seminar for approximately 85 participants on November 18. We will need a room with a sound system and screen. We would also like coffee service and a light lunch if available.

Since today is September 10, please let me know whether we would qualify for any early reservation discount.

Regards,
Thomas Reed

Reply

Dear Mr. Reed,

Thank you for your inquiry. For a group of 85, we recommend Oak Hall, which can comfortably accommodate your attendees. The room includes the sound system and screen you requested.

Your group is also large enough for our catering packages, so we can provide coffee service and a light lunch. However, because your requested date is less than two months away, the early reservation discount would not apply.

Sincerely,
Amanda Cho
Event Sales Manager`, [
    [191, "Which room is recommended for Thomas Reed’s seminar?", ["Maple Room", "Oak Hall", "Lakeview Room", "Private Dining Room"], "Oak Hall"],
    [192, "Why is that room recommended?", ["It is the only room with Internet.", "It can accommodate 85 participants.", "It is available only in November.", "It includes free catering."], "It can accommodate 85 participants."],
    [193, "What is included with each room rental?", ["Hotel rooms", "A sound system and screen", "Printed seminar materials", "Transportation service"], "A sound system and screen"],
    [194, "Why can Thomas’s group order catering?", ["The seminar is half a day.", "The group has more than 30 participants.", "The seminar is in November.", "Thomas requested a discount."], "The group has more than 30 participants."],
    [195, "Why does the early reservation discount not apply?", ["The group is too small.", "The center does not offer discounts.", "The reservation date is less than two months away.", "Catering has already been requested."], "The reservation date is less than two months away."]
  ]);

  addBlock("Triple Passage 3", `Three Related Texts

Online Order Summary

Order No.: 6842
Customer: Westbrook Dental Clinic
Date Ordered: January 6

Item | Quantity | Unit Price | Total
Reception Desk Chairs | 4 | $85 | $340
Waiting Room Side Tables | 2 | $120 | $240
Magazine Racks | 3 | $45 | $135

Subtotal: $715
Delivery Fee: Free for orders over $700
Estimated Delivery: January 12

E-mail

To: OfficePro Furnishings
From: Karen Blake, Westbrook Dental Clinic
Subject: Order 6842 Delivery

Hello,

Order 6842 was delivered this morning, January 12. The chairs and magazine racks arrived in good condition, but only one side table was included. The delivery slip says two side tables were shipped.

Could you please check whether the second side table was left on the truck? We would like to have it before our waiting room reopens on January 15.

Regards,
Karen Blake

Reply

Dear Ms. Blake,

We apologize for the missing side table. After checking with the delivery driver, we confirmed that the second table was accidentally left at our warehouse. It will be sent by express delivery tomorrow morning at no charge.

You should receive it by January 14. Thank you for your understanding.

Sincerely,
Leo Martin
OfficePro Furnishings`, [
    [196, "What type of business placed the order?", ["A dental clinic", "A furniture warehouse", "A magazine publisher", "A delivery company"], "A dental clinic"],
    [197, "What was the subtotal of the order?", ["$340", "$580", "$700", "$715"], "$715"],
    [198, "Why was the delivery fee waived?", ["The order was over $700.", "The delivery was late.", "Karen used a coupon.", "The order included chairs."], "The order was over $700."],
    [199, "What problem does Karen report?", ["The chairs were damaged.", "One side table was missing.", "The magazine racks were incorrect.", "The delivery arrived on the wrong date."], "One side table was missing."],
    [200, "When should the missing item arrive?", ["January 6", "January 12", "January 14", "January 15"], "January 14"]
  ]);

  const q = (questionNo, data) => Object.assign(questions.find((item) => item.questionNo === questionNo) || {}, data);
  const genericWrong = "Các lựa chọn còn lại sai vì không khớp ngữ pháp, cấu trúc cố định hoặc thông tin được nêu trực tiếp trong câu/bài.";

  [
    [101, "unless = trừ khi. Câu phủ định will not process đi với unless rất hợp.", "despite/whereas/whether không tạo điều kiện cần để phòng kế toán xử lý biểu mẫu.", "Phòng kế toán sẽ không xử lý biểu mẫu hoàn tiền trừ khi chúng được nộp kèm biên lai gốc."],
    [102, "accurately là trạng từ bổ nghĩa cho động từ locate.", "accuracy/accuracies là danh từ; accurate là tính từ.", "Hệ thống tồn kho mới giúp nhân viên kho định vị hàng hóa chính xác hơn."],
    [103, "ask that + S + V nguyên mẫu là cấu trúc giả định; bị động dùng be sent.", "is/was/has been không đúng dạng giả định sau asked that.", "Cô Carter yêu cầu bản cuối cùng của brochure được gửi đến nhà in trước chiều thứ Năm."],
    [104, "highly confident là cụm tự nhiên, cần trạng từ trước tính từ confident.", "high/higher là tính từ hoặc dạng so sánh; height là danh từ.", "Nhóm phát triển sản phẩm rất tự tin rằng mẫu thử sẽ sẵn sàng để kiểm tra vào tháng tới."],
    [105, "which thay cho cả mệnh đề phía trước: phòng chứa được 40 người.", "what/who/whose không thay cho cả mệnh đề trước đó.", "Phòng đào tạo có thể chứa tới 40 người tham dự, điều này khiến nó phù hợp cho các workshop lớn."],
    [106, "before hợp logic: hợp đồng được xem xét trước khi thay đổi được phê duyệt.", "during/since/while không diễn tả đúng trình tự trước-sau trong câu.", "Hợp đồng đã được xem xét kỹ lưỡng trước khi bất kỳ thay đổi nào được phê duyệt."],
    [107, "Sau before có thể dùng V-ing nên traveling là đúng.", "travel/traveled/travels không đúng dạng sau before trong cụm này.", "Khách hàng được khuyên kiểm tra tình trạng còn hàng trực tuyến trước khi đến cửa hàng."],
    [108, "efficiently là trạng từ bổ nghĩa cho handling.", "efficient là tính từ; efficiency/efficiencies là danh từ.", "Quản lý chi nhánh khen nhóm vì đã xử lý lượng đơn hàng tăng bất ngờ rất hiệu quả."],
    [109, "additional cost nghĩa là chi phí bổ sung.", "addition/additions là danh từ; additionally là trạng từ.", "Nhà cung cấp đồng ý cung cấp linh kiện thay thế mà không tính thêm chi phí."],
    [110, "Until nghĩa là cho đến khi, phù hợp với việc chưa được tắt máy trước khi cập nhật xong.", "Although/Because of/In spite of không chỉ mốc thời gian kết thúc điều kiện.", "Cho đến khi bản cập nhật phần mềm hoàn tất, nhân viên không nên tắt máy tính."],
    [111, "Trước danh từ analysis cần tính từ thorough.", "thoroughly là trạng từ; thoroughness/more thoroughness là danh từ.", "Quyết định mở rộng ra thị trường nước ngoài của công ty dựa trên một phân tích kỹ lưỡng về nhu cầu người tiêu dùng."],
    [112, "whose reservations nghĩa là những khách mà đặt phòng của họ.", "who/whom chỉ người; which chỉ vật và không thể hiện sở hữu.", "Khách sạn cung cấp bữa sáng miễn phí cho những khách có đặt phòng bao gồm ít nhất hai đêm."],
    [113, "prior to + V-ing/N nghĩa là trước khi.", "instead of/even though/regardless không diễn tả trình tự trước khi nhận thẻ.", "Tất cả khách tham quan phải xuất trình giấy tờ tùy thân có ảnh trước khi nhận thẻ ra vào tạm thời."],
    [114, "overwhelmingly là trạng từ đứng trước tính từ positive.", "overwhelming là tính từ; overwhelm là động từ; overwhelmed không hợp nghĩa.", "Kết quả khảo sát khách hàng cực kỳ tích cực, đặc biệt là về tốc độ giao hàng."],
    [115, "additional copies nghĩa là các bản sao bổ sung.", "addition/additions là danh từ; additionally là trạng từ.", "Giám đốc marketing yêu cầu thêm các bản sao của bài thuyết trình cho cuộc họp hội đồng."],
    [116, "later than scheduled là cấu trúc so sánh đúng.", "late/lately/lateness không tạo so sánh với than scheduled.", "Vì chuyến bay của diễn giả chính bị hoãn, phiên khai mạc bắt đầu muộn hơn dự kiến."],
    [117, "Câu kể hành động quá khứ nên dùng inspected.", "inspection/inspector là danh từ; inspecting không làm vị ngữ quá khứ ở đây.", "Đội bảo trì đã kiểm tra thang máy hai lần trước khi tuyên bố nó an toàn để sử dụng."],
    [118, "as long as nghĩa là miễn là, đưa ra điều kiện sử dụng phòng gym.", "as far as/as many as/as soon không diễn tả đúng điều kiện hoàn thành định hướng.", "Nhân viên có thể sử dụng phòng gym của công ty miễn là họ hoàn thành buổi định hướng an toàn trước."],
    [119, "those who... nghĩa là những người mà...", "them/their/these không tạo cụm danh từ chỉ người kèm mệnh đề quan hệ who.", "Ban tổ chức hội nghị đã gửi lời nhắc đến những người chưa xác nhận tham dự."],
    [120, "make + object + adjective nên dùng appealing.", "appeal/appealed/appeals không phải tính từ phù hợp sau make the product more.", "Thiết kế bao bì mới được kỳ vọng sẽ khiến sản phẩm hấp dẫn hơn đối với người tiêu dùng trẻ."],
    [121, "discuss whether... nghĩa là thảo luận liệu có nên hay không.", "while/despite/during không giới thiệu nội dung lựa chọn cần thảo luận.", "Ủy ban tài chính sẽ họp vào tuần tới để thảo luận liệu ngân sách đề xuất có nên được sửa đổi hay không."],
    [122, "steadily là trạng từ bổ nghĩa cho increased.", "steady là tính từ; steadiness là danh từ; steadied là động từ quá khứ.", "Công ty đã tăng đều đặn khoản đầu tư vào đào tạo nhân viên trong ba năm qua."],
    [123, "remain closed until... nghĩa là vẫn đóng cho đến khi...", "among/over/within không tạo mốc kết thúc trạng thái đóng cửa.", "Khu vực chỗ ngồi ngoài trời của nhà hàng sẽ tiếp tục đóng cho đến khi việc cải tạo hoàn tất."],
    [124, "at the front desk là cụm cố định: tại quầy lễ tân.", "in/on/among không đúng với cụm địa điểm front desk.", "Lễ tân yêu cầu người giao hàng để gói hàng tại quầy lễ tân."],
    [125, "be designed to + V nguyên mẫu nên dùng process.", "processing/processed/procession sai dạng sau to.", "Hệ thống thanh toán trực tuyến được thiết kế để xử lý giao dịch an toàn hơn."],
    [126, "which thay cho the workshop và nối thêm thông tin về workshop.", "who/whom chỉ người; whose chỉ sở hữu.", "Một số nhân viên đã tham dự workshop, workshop này tập trung vào việc cải thiện giao tiếp với khách hàng."],
    [127, "easily là trạng từ bổ nghĩa cho accessible.", "easy/easier là tính từ; ease là danh từ/động từ.", "Công ty chọn địa điểm trung tâm vì nơi đó dễ dàng tiếp cận bằng phương tiện công cộng."],
    [128, "Upon + V-ing nghĩa là ngay sau khi làm gì.", "Despite/Unless/About không diễn tả thời điểm sau khi hoàn thành biểu mẫu.", "Sau khi hoàn thành biểu mẫu trực tuyến, ứng viên sẽ nhận được email xác nhận."],
    [129, "considerably là trạng từ bổ nghĩa cho cụm so sánh more detailed.", "considerable là tính từ; consideration là danh từ; considering không phù hợp.", "Bản đề xuất đã sửa chi tiết hơn đáng kể so với bản gốc."],
    [130, "with care là cụm đúng, nghĩa là cẩn thận.", "careful là tính từ; carefully là trạng từ; caring không đúng cụm with care.", "Giám sát kho nhắc nhân viên xử lý hàng dễ vỡ một cách cẩn thận."]
  ].forEach(([questionNo, explain, wrongNote, translate]) => q(questionNo, { explain, wrongNote, translate }));

  const details = {
    131: ["guessed tạo bị động can be easily guessed, nghĩa là có thể dễ dàng bị đoán ra.", genericWrong, "Mật khẩu không nên chứa thông tin cá nhân dễ bị đoán như ngày sinh hoặc tên nhân viên."],
    132: ["In addition thêm thông tin: ngoài nhắc tự động, nhân viên cũng có thể cập nhật sớm.", genericWrong, "Ngoài ra, bạn có thể cập nhật mật khẩu sớm hơn bằng cách chọn Account Settings trên intranet."],
    133: ["Câu không chia sẻ mật khẩu phù hợp trực tiếp với chủ đề bảo mật.", genericWrong, "Vui lòng không chia sẻ mật khẩu của bạn với bất kỳ ai."],
    134: ["Email thông báo nhân viên phải cập nhật mật khẩu mỗi 90 ngày và nêu quy định mới.", genericWrong, "Mục đích email là thông báo chính sách mật khẩu mới."],
    135: ["at least two business days in advance nghĩa là trước ít nhất hai ngày làm việc.", genericWrong, "Khách cần giao hàng sáng sớm nên liên hệ trước ít nhất hai ngày làm việc."],
    136: ["In contrast tạo đối lập giữa giao hàng trung tâm bị đổi giờ và ngoại ô vẫn bình thường.", genericWrong, "Ngược lại, giao hàng đến khu vực ngoại ô vẫn theo lịch thường lệ."],
    137: ["Câu theo dõi đơn hàng qua website phù hợp trước lời xin lỗi về bất tiện.", genericWrong, "Khách hàng vẫn có thể theo dõi đơn hàng qua website."],
    138: ["Notice nêu rõ thay đổi do road repairs near the main distribution center.", genericWrong, "Việc thay đổi giờ giao hàng liên quan đến sửa đường."],
    139: ["was inspired by nghĩa là được truyền cảm hứng từ/xuất phát từ.", genericWrong, "Ý tưởng xuất phát từ đề xuất của khách hàng và mong muốn vận hành bền vững hơn."],
    140: ["In addition thêm một hành động nữa trong chương trình giảm rác thải.", genericWrong, "Ngoài ra, quán dự định quyên góp bánh chưa bán hết cho tổ chức từ thiện thực phẩm địa phương."],
    141: ["Câu này làm rõ ưu đãi giảm giá chỉ áp dụng cho cốc tái sử dụng.", genericWrong, "Ưu đãi giảm giá chỉ áp dụng cho cốc tái sử dụng."],
    142: ["Bài viết chủ yếu nói về chương trình giảm rác thải của quán.", genericWrong, "Bài viết chủ yếu nói về sáng kiến môi trường của quán cà phê."],
    143: ["ahead of time nghĩa là trước, phù hợp với việc đội kỹ thuật kiểm tra thiết bị.", genericWrong, "Đội kỹ thuật có thể kiểm tra thiết bị trước."],
    144: ["Additionally bổ sung yêu cầu check-in của diễn giả.", genericWrong, "Ngoài ra, diễn giả nên check-in tại quầy đăng ký ít nhất 30 phút trước phiên nói."],
    145: ["Câu bản đồ địa điểm được đính kèm phù hợp ngữ cảnh email hội nghị.", genericWrong, "Bản đồ địa điểm được đính kèm để thuận tiện cho bà."],
    146: ["Email nói gửi slide trước 15/5 để đội kỹ thuật kiểm tra thiết bị.", genericWrong, "Bà Walsh cần gửi slide trước ngày 15 tháng 5 để đội kỹ thuật kiểm tra thiết bị."],
    147: ["Notice thông báo employee kitchen on the third floor will be closed for renovation.", genericWrong, "Thông báo nhằm báo về việc cải tạo bếp nhân viên tầng 3."],
    148: ["Trong thời gian cải tạo, nhân viên có thể dùng bếp tầng 5.", genericWrong, "Nhân viên có thể chuẩn bị thức ăn ở bếp tầng 5."],
    149: ["Do chỗ trong tủ lạnh tầng 5 có hạn nên chỉ nên mang đồ ăn nhỏ.", genericWrong, "Nhân viên được yêu cầu mang đồ ăn trưa nhỏ vì chỗ tủ lạnh có hạn."],
    150: ["Coffee and tea service sẽ có ở Conference Room 3B mỗi sáng 8:00-10:00.", genericWrong, "Cà phê và trà sẽ tạm thời có ở Phòng họp 3B."],
    151: ["Email nói về updated call script cho bộ phận chăm sóc khách hàng.", genericWrong, "Email nói về quy trình/kịch bản gọi điện mới."],
    152: ["Kịch bản mới dùng cho khách hỏi về delayed shipments.", genericWrong, "Kịch bản mới dùng để xử lý câu hỏi về lô hàng bị chậm."],
    153: ["Script nằm trong shared folder Customer Support Resources.", genericWrong, "Nhân viên có thể tìm kịch bản trong thư mục chia sẻ."],
    154: ["Rachel sẽ nghe các cuộc gọi ghi âm để kiểm tra quy trình.", genericWrong, "Tuần sau Rachel sẽ nghe một số cuộc gọi được ghi âm."],
    155: ["Quảng cáo giới thiệu không gian chuyên nghiệp cho meetings, interviews, workshops.", genericWrong, "Quảng cáo về phòng họp/phòng làm việc chuyên nghiệp."],
    156: ["Each room includes complimentary coffee service.", genericWrong, "Mỗi phòng có dịch vụ cà phê miễn phí."],
    157: ["Catering cần at least 48 hours' notice.", genericWrong, "Dịch vụ catering cần thông báo trước ít nhất 48 giờ."],
    158: ["Book before July 31 được giảm 20%.", genericWrong, "Khách nhận giảm 20% nếu đặt trước ngày 31 tháng 7."],
    159: ["Maya nói một banner có old company logo.", genericWrong, "Maya báo rằng một banner có logo công ty cũ."],
    160: ["Display booth opens at 9:00 A.M. tomorrow.", genericWrong, "Gian hàng triển lãm mở lúc 9 giờ sáng ngày mai."],
    161: ["Owen nói sẽ gửi corrected file trong năm phút tới.", genericWrong, "Owen sẽ gửi file đã chỉnh sửa."],
    162: ["Maya đồng ý đi lấy banner sau giờ làm trước khi tiệm đóng cửa.", genericWrong, "Có thể suy ra Maya sẽ đi lấy banner đã in lại sau giờ làm."],
    163: ["Everton Components là manufacturer of electronic parts.", genericWrong, "Everton Components là nhà sản xuất linh kiện điện tử."],
    164: ["Giải thưởng ghi nhận công ty duy trì an toàn lao động tốt.", genericWrong, "Công ty nhận giải vì duy trì thực hành an toàn lao động tốt."],
    165: ["Monthly equipment inspections giúp giảm workplace incidents.", genericWrong, "Kiểm tra thiết bị hàng tháng giúp giảm tai nạn tại nơi làm việc."],
    166: ["Công ty dự định đầu tư thêm protective equipment vào mùa hè.", genericWrong, "Mùa hè này công ty dự định đầu tư thêm thiết bị bảo hộ."],
    167: ["Lịch ghi Priya Shah dạy Excel for Office Professionals.", genericWrong, "Priya Shah dạy khóa Excel for Office Professionals."],
    168: ["Supervisory Skills bắt đầu ngày September 12.", genericWrong, "Khóa bắt đầu ngày 12 tháng 9 là Supervisory Skills."],
    169: ["Registration closes one week before each course begins.", genericWrong, "Đăng ký đóng một tuần trước khi mỗi khóa bắt đầu."],
    170: ["Sinh viên đăng ký từ hai khóa trở lên được giảm 10%.", genericWrong, "Sinh viên được giảm giá khi đăng ký từ hai khóa trở lên."],
    171: ["Memo thông báo yêu cầu báo cáo mới sau các cuộc gặp khách hàng.", genericWrong, "Memo nói về yêu cầu báo cáo mới sau các cuộc gặp khách hàng."],
    172: ["Reports must be submitted within 24 hours of each meeting.", genericWrong, "Báo cáo phải được nộp trong vòng 24 giờ sau mỗi cuộc họp."],
    173: ["New reporting form is available in the sales portal.", genericWrong, "Mẫu báo cáo mới có trong cổng thông tin bán hàng."],
    174: ["Reports giúp managers identify common customer needs.", genericWrong, "Báo cáo giúp quản lý nhận diện các nhu cầu chung của khách hàng."],
    175: ["Laura nói công ty tổ chức three-day leadership retreat.", genericWrong, "Laura Bennett đang tổ chức một kỳ retreat lãnh đạo kéo dài ba ngày."],
    176: ["Laura expect approximately 32 employees to attend.", genericWrong, "Dự kiến có khoảng 32 nhân viên tham dự."],
    177: ["Laura hỏi về room block và small meeting room.", genericWrong, "Laura hỏi về việc đặt nhóm phòng khách sạn và một phòng họp nhỏ."],
    178: ["Cedar Room can accommodate up to 35 people.", genericWrong, "Cedar Room có thể chứa tối đa 35 người."],
    179: ["Khách sạn có 24 phòng, đủ yêu cầu tối thiểu 20 phòng.", genericWrong, "Khách sạn có đủ phòng tiêu chuẩn cho yêu cầu tối thiểu của Laura."],
    180: ["CityPrint Express offers same-day printing.", genericWrong, "CityPrint Express cung cấp dịch vụ in trong ngày."],
    181: ["Marcus cần six large-format posters.", genericWrong, "Marcus cần in sáu poster khổ lớn."],
    182: ["Đơn trước 11:00 A.M. thường sẵn sàng trong ngày; Marcus gửi trước 10:30.", genericWrong, "Đơn hàng nên sẵn sàng trong ngày vì Marcus gửi file trước 11 giờ sáng."],
    183: ["Sáu poster x 18 đô = 108 đô.", genericWrong, "Tổng chi phí trước phí gấp là 108 đô la."],
    184: ["Marcus gửi trước 11:00 và nhận sau 4:30, không yêu cầu dưới bốn giờ.", genericWrong, "Có thể suy ra đơn hàng không cần phí gấp."],
    185: ["Job Posting tuyển Marketing Coordinator.", genericWrong, "Vị trí được tuyển là điều phối viên marketing."],
    186: ["Ứng viên phải nộp two writing samples.", genericWrong, "Ứng viên phải nộp hai mẫu bài viết."],
    187: ["Elena hiện làm tại regional furniture company.", genericWrong, "Elena hiện làm tại một công ty nội thất khu vực."],
    188: ["Elena managed weekly social media posts.", genericWrong, "Elena từng quản lý các bài đăng mạng xã hội hằng tuần."],
    189: ["Nadia nói Elena appears to meet the main requirements.", genericWrong, "Nadia nói Elena có vẻ đáp ứng các yêu cầu chính."],
    190: ["Nadia đề xuất mời Elena phỏng vấn vòng đầu tuần sau.", genericWrong, "Khả năng tiếp theo là Elena sẽ được mời phỏng vấn vòng đầu."],
    191: ["Reply đề xuất Oak Hall cho nhóm 85 người.", genericWrong, "Phòng được đề xuất là Oak Hall."],
    192: ["Oak Hall phù hợp vì chứa được 85 người tham dự.", genericWrong, "Oak Hall được đề xuất vì có thể chứa 85 người tham dự."],
    193: ["Each rental includes a sound system and a screen.", genericWrong, "Mỗi phòng thuê bao gồm hệ thống âm thanh và màn chiếu."],
    194: ["Catering packages available for groups of 30 or more; nhóm có 85 người.", genericWrong, "Nhóm của Thomas có thể đặt catering vì có hơn 30 người."],
    195: ["Ngày hỏi 10/9, sự kiện 18/11 chưa đủ ít nhất hai tháng theo chính sách.", genericWrong, "Không được giảm giá đặt sớm vì ngày tổ chức cách ngày hỏi chưa đủ hai tháng."],
    196: ["Customer là Westbrook Dental Clinic.", genericWrong, "Đơn hàng do một phòng khám nha khoa đặt."],
    197: ["Subtotal ghi rõ $715.", genericWrong, "Tổng phụ là 715 đô la."],
    198: ["Delivery Fee: Free for orders over $700; đơn hàng $715.", genericWrong, "Phí giao hàng được miễn vì đơn hàng trên 700 đô la."],
    199: ["Karen báo chỉ có một side table dù phiếu giao ghi hai.", genericWrong, "Karen báo thiếu một bàn phụ."],
    200: ["Reply nói món thiếu sẽ đến by January 14.", genericWrong, "Món hàng bị thiếu dự kiến đến vào ngày 14 tháng 1."]
  };
  Object.entries(details).forEach(([questionNo, [explain, wrongNote, translate]]) => q(Number(questionNo), { explain, wrongNote, translate }));

  const groupTranslations = {
    "Text 1": "Từ thứ Hai, tất cả nhân viên phải cập nhật mật khẩu mạng mỗi 90 ngày. Khi tạo mật khẩu mới, hãy dùng ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký hiệu. Mật khẩu không nên chứa thông tin cá nhân dễ đoán như ngày sinh hoặc tên nhân viên. Hệ thống sẽ nhắc trước bảy ngày và nhân viên có thể cập nhật sớm hơn trong Account Settings.",
    "Text 2": "Do sửa đường gần trung tâm phân phối chính, giờ giao hàng tạm thời thay đổi từ ngày 3 đến 14 tháng 4. Địa chỉ trung tâm sẽ được giao từ 10 giờ sáng đến 6 giờ chiều thay vì 8 giờ sáng đến 4 giờ chiều. Khách cần giao sáng sớm nên liên hệ trước ít nhất hai ngày làm việc. Giao hàng ngoại ô vẫn theo lịch thường lệ.",
    "Text 3": "Harbor Cafe triển khai chương trình giảm rác thải nhằm giảm bao bì dùng một lần. Khách mang cốc tái sử dụng được giảm 10% cho đồ uống cà phê và trà. Ý tưởng xuất phát từ đề xuất của khách hàng và mong muốn vận hành bền vững hơn. Quán cũng dùng hộp có thể ủ phân và quyên góp bánh chưa bán hết mỗi tối.",
    "Text 4": "Aaron Bell yêu cầu Ms. Walsh gửi tiểu sử ngắn và tóm tắt bài thuyết trình trước ngày 28 tháng 4 để in trong booklet hội nghị. Nếu dùng slide, bà cần gửi trước ngày 15 tháng 5 để đội kỹ thuật kiểm tra thiết bị trước. Diễn giả cũng nên check-in tại quầy đăng ký ít nhất 30 phút trước phiên nói.",
    "Single Passage 1": "Bếp nhân viên tầng 3 sẽ đóng từ ngày 10 đến 14 tháng 6 để lắp tủ mới và thiết bị tiết kiệm năng lượng. Trong thời gian cải tạo, nhân viên có thể dùng bếp tầng 5. Vì tủ lạnh tầng 5 có hạn, nhân viên chỉ nên mang đồ ăn trưa nhỏ. Cà phê và trà tạm thời có ở Phòng họp 3B từ 8:00 đến 10:00 mỗi sáng.",
    "Single Passage 2": "Rachel Nguyen thông báo bộ phận chăm sóc khách hàng dùng kịch bản gọi điện mới cho khách hỏi về lô hàng bị chậm. Kịch bản có hướng dẫn kiểm tra trạng thái đơn, giải thích thời gian giao và hoàn phí vận chuyển khi phù hợp. Nhân viên tìm kịch bản trong thư mục Customer Support Resources. Tuần sau Rachel sẽ nghe một số cuộc gọi ghi âm để kiểm tra việc áp dụng.",
    "Single Passage 3": "MetroPoint Meeting Suites quảng cáo các phòng họp chuyên nghiệp ở khu thương mại trung tâm cho cuộc họp, phỏng vấn hoặc workshop. Mỗi phòng có Internet tốc độ cao, máy chiếu, bảng trắng và cà phê miễn phí. Có thể đặt theo giờ, nửa ngày hoặc cả ngày. Catering cần báo trước ít nhất 48 giờ. Đặt trước ngày 31 tháng 7 được giảm 20% cho lần đặt đầu.",
    "Single Passage 4": "Maya báo với Owen rằng banner thay thế cho hội chợ ngày mai đã đến, nhưng một banner có logo công ty cũ. Gian hàng mở lúc 9:00 sáng ngày mai. Tiệm in có thể in lại trước 5:00 chiều nếu gửi file đúng ngay. Owen sẽ gửi file trong năm phút, còn Maya sẽ lấy banner sau giờ làm trước khi tiệm đóng cửa.",
    "Single Passage 5": "Everton Components, nhà sản xuất linh kiện điện tử, nhận giải Regional Workplace Safety Award năm thứ hai liên tiếp. Giải ghi nhận công ty có tỷ lệ tai nạn thấp và đào tạo an toàn thường xuyên. Everton giảm tai nạn 18% sau khi áp dụng kiểm tra thiết bị hàng tháng và đào tạo nhắc lại cho người vận hành máy. Mùa hè này công ty sẽ đầu tư thêm thiết bị bảo hộ và mở rộng đào tạo an toàn cho nhân viên kho.",
    "Single Passage 6": "Northside Community College mở các khóa kinh doanh buổi tối: Introduction to Accounting, Business Writing Workshop, Excel for Office Professionals và Supervisory Skills. Đăng ký đóng một tuần trước khi mỗi khóa bắt đầu. Sinh viên đăng ký từ hai khóa trở lên được giảm 10% tổng học phí.",
    "Single Passage 7": "Từ tháng sau, mọi đại diện bán hàng phải nộp báo cáo thăm khách trong vòng 24 giờ sau mỗi cuộc họp. Báo cáo gồm mối quan tâm chính của khách, cơ hội bán hàng và hành động cần theo dõi. Mẫu mới có trong cổng thông tin bán hàng. Báo cáo giúp quản lý nhận diện nhu cầu chung của khách hàng và phối hợp hỗ trợ giữa các khu vực.",
    "Double Passage 1": "Laura Bennett đang tổ chức kỳ retreat lãnh đạo ba ngày từ ngày 9 đến 11 tháng 10, dự kiến khoảng 32 nhân viên. Cô muốn đặt một nhóm phòng khách sạn cho các đêm 8, 9 và 10 tháng 10, cần ít nhất 20 phòng, đồng thời cần một phòng họp nhỏ sáng ngày 9 tháng 10. Hillcrest Hotel có 24 phòng tiêu chuẩn và Cedar Room từ 8:00 đến trưa, chứa tối đa 35 người, có máy chiếu và Internet không dây.",
    "Double Passage 2": "CityPrint Express cung cấp in trong ngày cho tờ rơi, poster và tài liệu thuyết trình. Đơn gửi trước 11:00 sáng thường sẵn sàng trước 5:00 chiều. Poster khổ lớn giá 18 đô mỗi cái; phí gấp 15% áp dụng cho đơn yêu cầu dưới bốn giờ. Marcus cần in sáu poster cho buổi thuyết trình sáng mai, có thể gửi file trước 10:30 và lấy sau 4:30, nên tổng là 108 đô và không cần phí gấp.",
    "Triple Passage 1": "Brookfield Home Goods tuyển điều phối viên marketing để hỗ trợ ra mắt sản phẩm, chiến dịch mạng xã hội và sự kiện khuyến mãi. Ứng viên cần ít nhất hai năm kinh nghiệm marketing, kỹ năng viết tốt và nộp sơ yếu lý lịch, thư xin việc, hai mẫu bài viết. Elena Rossi ứng tuyển, hiện làm communications assistant tại một công ty nội thất khu vực, từng viết mô tả sản phẩm, quản lý bài đăng mạng xã hội hằng tuần và hỗ trợ sự kiện. Nadia đánh giá Elena đáp ứng yêu cầu chính và đề xuất mời phỏng vấn vòng đầu.",
    "Triple Passage 2": "Lakeview Conference Center có Oak Hall chứa tối đa 120 khách và Maple Room chứa tối đa 60 khách. Mỗi phòng thuê có Internet, hệ thống âm thanh và màn chiếu. Catering có cho nhóm từ 30 người trở lên. Đặt trước ít nhất hai tháng được giảm 10% phí phòng. Thomas Reed cần phòng cho khoảng 85 người ngày 18 tháng 11 và hỏi ngày 10 tháng 9, nên được đề xuất Oak Hall và có thể đặt catering, nhưng không đủ điều kiện giảm giá đặt sớm.",
    "Triple Passage 3": "Westbrook Dental Clinic đặt 4 ghế quầy tiếp tân, 2 bàn phụ phòng chờ và 3 kệ tạp chí, tổng phụ 715 đô nên được miễn phí giao hàng. Đơn giao ngày 12 tháng 1, ghế và kệ tạp chí ổn nhưng chỉ có một bàn phụ. OfficePro xác nhận bàn thứ hai bị để lại ở kho và sẽ gửi hỏa tốc miễn phí sáng hôm sau. Khách sẽ nhận trước ngày 14 tháng 1."
  };
  questions.forEach((item) => {
    if (item.group && groupTranslations[item.group]) item.groupTranslation = groupTranslations[item.group];
  });

  window.TOEIC_READING_EXAMS.y2019 = {
    meta: {
      id: "y2019",
      label: "TOEIC Reading 2019",
      company: "Brookfield Home Goods",
      place: "Metro Business District",
      event: "business conference and client services",
      product: "online payment system",
      department: "customer service",
      service: "same-day printing",
      theme: "2019-style workplace, service, hiring, events, and business operations"
    },
    questions
  };
})();
