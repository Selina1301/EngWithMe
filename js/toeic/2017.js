// TOEIC Reading 2017 data.
window.TOEIC_READING_EXAMS = window.TOEIC_READING_EXAMS || {};

(() => {
  const questions = [];
  const add = (partNumber, questionNo, question, options, answer, passage = null, group = null, explain = "Correct answer from the supplied answer key.") => {
    questions.push({
      partNumber,
      questionNo,
      ...(group ? { group } : {}),
      ...(passage ? { passage } : {}),
      question,
      options,
      answer,
      explain
    });
  };

  const passage1 = `E-mail
To: All Staff
From: Human Resources
Subject: Security Badge Renewal

Dear Staff,

All employee security badges will expire at the end of this month. To avoid any interruption in building access, please visit the Human Resources office between May 10 and May 18 to have your badge renewed. The process takes approximately five minutes and does not require an appointment.

Employees who work at remote sites should send a recent photo to hr@northbridge.com by May 12. A new badge will then be mailed to your location. Please note that old badges will no longer ------- (31) after May 31.

We appreciate your cooperation. ------- (32), please bring a government-issued photo ID when you come to the HR office.

If your badge is lost or damaged, report it immediately so that a replacement can be issued. Replacement fees may apply in some cases. ------- (33)

Thank you for helping us maintain a secure workplace.`;

  const passage2 = `Notice

Barton Office Supply will be closed on Monday, July 3, for inventory inspection. During this time, customers may still place orders through our Web site. Orders submitted online will be processed ------- (35) on Tuesday morning.

Customers who need urgent assistance may call our temporary service line at 555-0198. A representative will be available from 9:00 A.M. to 3:00 P.M. ------- (36), delivery service will not be available on July 3.

We apologize for any inconvenience and appreciate your understanding. ------- (37)

Regular store hours will resume on Tuesday, July 4.`;

  const passage3 = `Article

The Lakeside Business Association has announced the winners of its annual Small Business Awards. The awards recognize local companies that have shown strong growth, excellent customer service, and commitment to the community.

This year’s top award went to Green Spoon Café, a restaurant ------- (39) locally grown ingredients in all of its dishes. Since opening three years ago, the café has doubled its staff and expanded its catering service.

Owner Lena Morris said the award was a surprise. “Our team works hard every day, and it is wonderful to see that effort ------- (40),” she said.

The association will host a dinner on June 14 to celebrate all award recipients. ------- (41) Tickets can be purchased through the association’s Web site until June 7.`;

  const passage4 = `E-mail
To: Daniel Cho
From: Sophie Turner
Subject: Product Demonstration

Dear Mr. Cho,

Thank you for expressing interest in the HN-40 portable scanner. I am pleased to confirm that one of our product specialists will visit your office next Wednesday at 10:00 A.M. to give a demonstration.

The demonstration usually lasts about forty minutes and includes a brief question-and-answer session. ------- (43), your staff will have an opportunity to test the scanner using sample documents.

Please let us know if there are any specific features you would like us to cover. We can also provide information about ------- (44) discounts for companies ordering more than ten units.

------- (45) I have attached a brochure with technical specifications for your review.

Sincerely,
Sophie Turner
Sales Coordinator, Hanning Electronics`;

  const passage5 = `Notice

Building Maintenance Notice

On Saturday, March 18, maintenance workers will inspect the elevators at Greenfield Tower. The inspection will begin at 8:00 A.M. and is expected to end by 2:00 P.M.

During this time, only one elevator will be available for use. Tenants are advised to allow extra time when entering or leaving the building. Freight deliveries should be scheduled for after 2:30 P.M.

For questions, contact the building management office at extension 204.`;

  const passage6 = `E-mail
To: Carla Mendes
From: Adrian Lee
Subject: Revised Seating Chart

Hi Carla,

I reviewed the seating chart for next month's regional sales meeting. Since the number of attendees has increased from 80 to 96, we will need to use the larger ballroom at the Parkview Hotel.

Could you please contact the hotel and ask whether the Oak Ballroom is still available on April 12? If it is, please request classroom-style seating and two registration tables near the entrance.

Also, please ask the hotel to extend the morning coffee service by thirty minutes. Several participants will be arriving from out of town and may not reach the hotel until just before the first session begins.

Thanks,
Adrian`;

  const passage7 = `Advertisement

Harbor View Printing — Business Printing Made Simple

Harbor View Printing provides fast and affordable printing services for small businesses. We print business cards, brochures, posters, menus, and product labels. Most standard orders are completed within two business days.

New customers receive 15 percent off their first order of $100 or more. To receive the discount, enter the code NEW15 when placing an order online. The offer is valid until September 30 and cannot be combined with other promotions.

Need help with design? Our graphic design team can create a custom layout for an additional fee. Visit www.harborviewprint.com to view samples and pricing.`;

  const passage8 = `Text-Message Chain

Monica: Hi, Ravi. The delivery from Westbrook Foods just arrived, but three boxes of tomatoes are missing.
Ravi: Thanks for checking. Did the invoice list all ten boxes?
Monica: Yes. The invoice says ten, but we received only seven.
Ravi: Please take a photo of the invoice and the delivery area. I’ll call Westbrook and ask them to send the missing boxes this afternoon.
Monica: Good idea. We need them for tomorrow’s lunch special.
Ravi: I’ll mark the order as incomplete in our system.`;

  const passage9 = `Article

Local Software Firm Expands Customer Support Team

MapleSoft, a software company based in Portland, announced yesterday that it will hire twelve additional customer support specialists over the next two months. The decision follows a 35 percent increase in subscriptions to the company’s accounting software for small businesses.

According to MapleSoft CEO Jordan Blake, the new employees will help reduce response times and provide extended evening support. “Many of our customers run businesses during the day and contact us after regular office hours,” Blake said.

The company will host an open recruitment event at its headquarters on Friday, May 5. Applicants are encouraged to bring résumés and may be interviewed on-site.`;

  const passage10 = `Schedule

Easton Professional Training Center
Workshop Schedule — June

Date | Workshop | Time | Instructor
June 6 | Effective E-mail Writing | 9:00 A.M.–12:00 P.M. | Linda Park
June 9 | Project Budget Basics | 1:00 P.M.–4:00 P.M. | Thomas Hill
June 14 | Presentation Skills | 10:00 A.M.–3:00 P.M. | Nina Cole
June 20 | Customer Service Strategies | 9:30 A.M.–12:30 P.M. | Marcus Reed

Registration closes five business days before each workshop. Participants will receive digital handouts one day before the workshop.`;

  const passage11 = `Memo
To: Warehouse Staff
From: Elena Garcia, Operations Manager
Subject: New Packing Procedure

Beginning Monday, all fragile items must be packed with the new recyclable cushioning material. The material is stored in labeled bins near Packing Station 3.

Please use only the new material for glassware, electronics, and ceramic products. A short demonstration will be given during each shift meeting on Monday and Tuesday. Supervisors will check outgoing packages throughout the week to ensure that the procedure is being followed.

This change is part of our effort to reduce plastic waste while maintaining safe shipping practices.`;

  const passage12 = `E-mail
To: Ridgeway Hotel Reservations
From: Hannah Brooks
Subject: Meeting Room Inquiry

Dear Reservations Team,

I am organizing a two-day training program for twenty-five employees on August 3 and 4. We need a meeting room with a projector, wireless Internet access, and space for small group activities.

Could you let me know whether a suitable room is available on those dates? We would also like morning coffee service and a light lunch on both days.

Sincerely,
Hannah Brooks

Reply

Dear Ms. Brooks,

Thank you for contacting Ridgeway Hotel. Our Willow Room is available on August 3 and 4 and can accommodate up to thirty people. It includes a projector, wireless Internet access, and movable tables that can be arranged for group work.

Coffee service is available for $8 per person per day, and our light lunch package is $18 per person per day. I have attached a quotation based on twenty-five participants.

Please confirm by July 20 if you would like us to reserve the Willow Room.

Best regards,
Daniel Hart
Event Coordinator`;

  const passage13 = `Web Page

Citywide Bicycle Rentals

Rent bicycles for business trips, sightseeing, or weekend events. All rentals include a helmet and lock.

Rental Type | Price
Half day | $12
Full day | $20
Three days | $48
Weekly | $85

Customers may reserve bicycles online. Cancellations made at least 24 hours before the rental period receive a full refund.

E-mail
To: Citywide Bicycle Rentals
From: Peter Lang
Subject: Reservation Change

Hello,

I reserved two bicycles for a full day this Saturday under the name Peter Lang. Unfortunately, our schedule has changed, and we will need the bicycles for three days instead. Could you please update the reservation and let me know the new total cost?

Thank you,
Peter Lang`;

  const passage14 = `Announcement

Community Arts Center — Volunteer Orientation

The Community Arts Center will hold a volunteer orientation on Thursday, October 12, from 6:00 P.M. to 8:00 P.M. Volunteers will learn about upcoming exhibitions, ticket desk duties, and procedures for assisting visitors.

Attendance is required for all new volunteers. Returning volunteers are welcome but not required to attend. Light refreshments will be served.

Note

Maya,

Could you attend the orientation in my place? I volunteered last year, so I do not have to go, but I would like someone from our team to hear about the new exhibition schedule. Please take notes about any changes to visitor check-in procedures.

Thanks,
Claire`;

  const passage15 = `Online Order Confirmation

Order Number: 42891
Customer: Willow Creek Café
Date: November 2

Item | Quantity | Price
Ceramic coffee mugs | 60 | $240
Stainless-steel teaspoons | 100 | $150
Linen napkins | 80 | $200

Estimated delivery: November 8
Shipping: Free for orders over $500

E-mail
To: Customer Service, Premier Restaurant Supply
From: Nina Shah, Willow Creek Café
Subject: Order 42891

Hello,

We received order 42891 this morning. The mugs and teaspoons arrived in good condition, but the linen napkins were not included in the shipment. The packing slip lists them as back-ordered.

Could you tell me when the napkins will be available? We need them before our private dinner event on November 15.

Regards,
Nina Shah

Reply

Dear Ms. Shah,

We apologize for the incomplete shipment. The linen napkins are expected to arrive at our warehouse on November 10. We will ship them to you by express delivery on the same day at no additional charge.

You should receive them by November 12. Thank you for your patience.

Sincerely,
Martin Bell
Customer Service Representative`;

  const passage16 = `Job Posting

Administrative Assistant — Benton Legal Services

Benton Legal Services seeks a full-time administrative assistant for its downtown office. Responsibilities include scheduling appointments, preparing client files, answering phones, and ordering office supplies.

Applicants should have at least two years of office experience and excellent organizational skills. Experience in a legal office is preferred but not required.

Please send a résumé and cover letter to careers@bentonlegal.com by April 7.

E-mail
To: careers@bentonlegal.com
From: Olivia Grant
Subject: Administrative Assistant Position

Dear Hiring Manager,

I would like to apply for the administrative assistant position advertised on your Web site. For the past three years, I have worked as an office coordinator at Mason Accounting, where I scheduled client meetings, maintained digital records, and handled supply orders.

Although I have not worked in a legal office, I am comfortable managing confidential documents and communicating with clients professionally. My résumé and cover letter are attached.

Sincerely,
Olivia Grant

Internal Note
To: Rachel Benton
From: Mark Ellison
Subject: Applicant Review

Rachel,

Olivia Grant looks like a strong candidate. She meets the experience requirement and has handled several tasks similar to those listed in our posting. She does not have legal office experience, but that was listed only as a preference.

I recommend inviting her for an interview next week.

Mark`;

  add("5", 101, "The sales department will release the quarterly report ------- the finance team verifies all figures.", ["although", "once", "unless", "despite"], "once", null, null, "Once means as soon as.");
  add("5", 102, "All employees are required to wear their identification badges ------- entering the main office building.", ["when", "toward", "between", "among"], "when", null, null, "When introduces the time of the action.");
  add("5", 103, "The new printer is more ------- than the previous model and uses less electricity.", ["efficiency", "efficiently", "efficient", "efficiencies"], "efficient", null, null, "An adjective follows more in this comparison.");
  add("5", 104, "Ms. Kim reminded the staff that travel expenses must be submitted ------- ten days of returning from a business trip.", ["within", "into", "about", "across"], "within", null, null, "Within means before the end of a period.");
  add("5", 105, "The marketing team has developed a campaign ------- to attract younger customers.", ["design", "designing", "designed", "designs"], "designed", null, null, "A reduced passive clause is needed: a campaign designed to attract.");
  add("5", 106, "Because the conference room is already booked, the training session will be held -------.", ["elsewhere", "otherwise", "anytime", "somewhat"], "elsewhere", null, null, "Elsewhere means in another place.");
  add("5", 107, "The company’s online ordering system allows customers to ------- their shipments in real time.", ["train", "track", "charge", "measure"], "track", null, null, "Track means monitor shipment status.");
  add("5", 108, "Mr. Alvarez is ------- responsible for reviewing supplier contracts before they are signed.", ["primary", "primarily", "primaries", "primed"], "primarily", null, null, "An adverb modifies responsible.");
  add("5", 109, "The hotel offers complimentary shuttle service ------- the airport and the downtown business district.", ["both", "either", "between", "throughout"], "between", null, null, "Between connects two places.");
  add("5", 110, "------- the product launch was delayed, advance orders remained strong.", ["Even though", "In addition", "As soon as", "Rather than"], "Even though", null, null, "Even though introduces contrast.");
  add("5", 111, "Please contact the help desk if you have difficulty ------- the new payroll system.", ["access", "accessed", "accessing", "to access"], "accessing", null, null, "Have difficulty is followed by a gerund.");
  add("5", 112, "The factory manager requested that all equipment ------- inspected before the end of the week.", ["be", "is", "was", "has been"], "be", null, null, "Request that takes the base subjunctive.");
  add("5", 113, "The workshop was canceled because ------- than ten people registered for it.", ["fewer", "less", "little", "lower"], "fewer", null, null, "Fewer is used with countable people.");
  add("5", 114, "Our customer service representatives are trained to respond ------- to complaints.", ["courtesy", "courteous", "courteously", "courteousness"], "courteously", null, null, "An adverb modifies respond.");
  add("5", 115, "The board members will vote on the proposed budget ------- Friday afternoon.", ["on", "at", "in", "by"], "on", null, null, "On is used with a day or day part.");
  add("5", 116, "A copy of the revised employee handbook has been ------- to all department supervisors.", ["distributed", "distributing", "distribution", "distributive"], "distributed", null, null, "Present perfect passive needs a past participle.");
  add("5", 117, "Customers who purchase a laptop this month will receive a ------- carrying case.", ["compliment", "complimentary", "completed", "comparable"], "complimentary", null, null, "Complimentary means free.");
  add("5", 118, "The restaurant is looking for a chef ------- has experience preparing vegetarian dishes.", ["whose", "whom", "who", "which"], "who", null, null, "Who refers to a person as subject.");
  add("5", 119, "Please make sure that the storage room is kept ------- at all times.", ["organize", "organized", "organizing", "organization"], "organized", null, null, "Kept is followed by an adjective/past participle.");
  add("5", 120, "Ms. Patel’s presentation was ------- informative that several managers requested copies of her slides.", ["so", "very", "too", "such"], "so", null, null, "The pattern is so + adjective + that.");
  add("5", 121, "The accounting department will issue refunds only after the original receipt -------.", ["provides", "is provided", "providing", "to provide"], "is provided", null, null, "A passive clause is needed.");
  add("5", 122, "The maintenance crew arrived early to ------- the heating system before the office opened.", ["inspect", "inspection", "inspector", "inspecting"], "inspect", null, null, "To is followed by a base verb.");
  add("5", 123, "The package should arrive tomorrow, ------- there are no unexpected delays.", ["provided that", "rather than", "in spite of", "according to"], "provided that", null, null, "Provided that introduces a condition.");
  add("5", 124, "Several applicants were invited for interviews because their qualifications closely ------- the job requirements.", ["matched", "matching", "matches", "matchable"], "matched", null, null, "Past tense matches were invited.");
  add("5", 125, "The city council approved the construction plan after a ------- review of the environmental report.", ["thorough", "thoroughly", "thoroughness", "more thoroughness"], "thorough", null, null, "An adjective modifies review.");
  add("5", 126, "Employees may reserve company vehicles ------- they have received authorization from their supervisor.", ["as long as", "as far as", "as much as", "as many as"], "as long as", null, null, "As long as introduces a condition.");
  add("5", 127, "The software update will be installed automatically, so users do not need to take any ------- action.", ["addition", "additional", "additionally", "additions"], "additional", null, null, "An adjective modifies action.");
  add("5", 128, "The store manager placed the most popular items near the entrance to make them more ------- to customers.", ["visible", "visibly", "visibility", "vision"], "visible", null, null, "An adjective is needed after make them more.");
  add("5", 129, "The training manual explains how to operate the machine ------- and safely.", ["correct", "corrected", "correctly", "correctness"], "correctly", null, null, "An adverb pairs with safely.");
  add("5", 130, "The airline apologized for the delay and offered passengers meal vouchers as -------.", ["compensation", "complication", "competition", "composition"], "compensation", null, null, "Compensation means something offered for inconvenience.");
  add("6", 131, "Choose the best answer for blank 31.", ["function", "functioning", "functional", "functioned"], "function", passage1, "Text 1", "After will no longer, use the base verb.");
  add("6", 132, "Choose the best answer for blank 32.", ["However", "In addition", "For example", "Otherwise"], "In addition", passage1, "Text 1", "The sentence adds another instruction.");
  add("6", 133, "Choose the sentence that best completes blank 33.", ["Please return the old printer to the supply room.", "The new cafeteria menu will be posted next week.", "Employees should not lend their badges to other people.", "The annual company picnic has been postponed."], "Employees should not lend their badges to other people.", passage1, "Text 1", "The sentence fits the security-badge topic.");
  add("6", 134, "What is the purpose of the e-mail?", ["To introduce a new employee benefit", "To announce a badge renewal procedure", "To explain changes to office hours", "To request feedback on a security policy"], "To announce a badge renewal procedure", passage1, "Text 1", "The e-mail explains how to renew security badges.");
  add("6", 135, "Choose the best answer for blank 35.", ["prompt", "promptly", "promptness", "prompted"], "promptly", passage2, "Text 2", "An adverb modifies processed.");
  add("6", 136, "Choose the best answer for blank 36.", ["Therefore", "Even so", "Similarly", "Meanwhile"], "Even so", passage2, "Text 2", "Even so introduces a contrast with limited service.");
  add("6", 137, "Choose the sentence that best completes blank 37.", ["We are currently hiring additional delivery drivers.", "Thank you for choosing Barton Office Supply.", "The downtown branch opened six years ago.", "Please submit your résumé by Friday."], "Thank you for choosing Barton Office Supply.", passage2, "Text 2", "This is an appropriate closing for a customer notice.");
  add("6", 138, "What is indicated about Barton Office Supply?", ["It will process online orders after the inspection.", "It has permanently changed its business hours.", "It will provide free delivery on July 3.", "It is moving to a new location."], "It will process online orders after the inspection.", passage2, "Text 2", "Online orders will be processed Tuesday morning.");
  add("6", 139, "Choose the best answer for blank 39.", ["uses", "used", "using", "use"], "using", passage3, "Text 3", "A reduced relative clause modifies restaurant.");
  add("6", 140, "Choose the best answer for blank 40.", ["recognize", "recognized", "recognition", "recognizing"], "recognized", passage3, "Text 3", "The passive meaning is effort recognized.");
  add("6", 141, "Choose the sentence that best completes blank 41.", ["The event is open to members and nonmembers.", "The cafe will be closed for renovations next month.", "The association recently moved to another city.", "The restaurant has stopped offering catering services."], "The event is open to members and nonmembers.", passage3, "Text 3", "The next sentence explains ticket purchase.");
  add("6", 142, "What is the article mainly about?", ["A restaurant's new menu", "An awards announcement", "A change in catering prices", "A business association's relocation"], "An awards announcement", passage3, "Text 3", "The article announces award winners.");
  add("6", 143, "Choose the best answer for blank 43.", ["In contrast", "Afterward", "Despite this", "Instead"], "Afterward", passage4, "Text 4", "Afterward describes what happens after the session.");
  add("6", 144, "Choose the best answer for blank 44.", ["volume", "volumes", "voluminous", "volumize"], "volume", passage4, "Text 4", "Volume discount is a standard noun phrase.");
  add("6", 145, "Choose the sentence that best completes blank 45.", ["The product was discontinued last year.", "Our office will be closed during the demonstration.", "Please find additional product details in the attachment.", "The scanner should not be used for business documents."], "Please find additional product details in the attachment.", passage4, "Text 4", "The next sentence mentions an attached brochure.");
  add("6", 146, "Why did Sophie Turner write to Daniel Cho?", ["To cancel a product order", "To confirm a scheduled demonstration", "To request payment for equipment", "To complain about a scanner problem"], "To confirm a scheduled demonstration", passage4, "Text 4", "The e-mail confirms the demonstration date and time.");
  add("7", 147, "What is the purpose of the notice?", ["To announce elevator maintenance", "To introduce a new tenant", "To explain parking rules", "To advertise office space"], "To announce elevator maintenance", passage5, "Single Passage 1", "The notice announces an elevator inspection.");
  add("7", 148, "What are tenants advised to do?", ["Use the freight entrance only", "Contact maintenance workers directly", "Allow additional travel time", "Leave the building before 8:00 A.M."], "Allow additional travel time", passage5, "Single Passage 1", "Tenants are advised to allow extra time.");
  add("7", 149, "When should freight deliveries be scheduled?", ["Before 8:00 A.M.", "Between 8:00 A.M. and 10:00 A.M.", "At noon", "After 2:30 P.M."], "After 2:30 P.M.", passage5, "Single Passage 1", "The notice says freight deliveries should be after 2:30 P.M.");
  add("7", 150, "Why does Adrian want to change the meeting room?", ["The original room is too small.", "The original room is being renovated.", "The meeting date has changed.", "The hotel increased its prices."], "The original room is too small.", passage6, "Single Passage 2", "The attendee count increased to 96.");
  add("7", 151, "What does Adrian ask Carla to check?", ["Whether more chairs can be rented", "Whether the Oak Ballroom is available", "Whether lunch can be served earlier", "Whether the hotel offers shuttle service"], "Whether the Oak Ballroom is available", passage6, "Single Passage 2", "Adrian asks Carla to ask if the Oak Ballroom is available.");
  add("7", 152, "What seating arrangement is requested?", ["Theater-style", "Banquet-style", "Classroom-style", "Boardroom-style"], "Classroom-style", passage6, "Single Passage 2", "The e-mail requests classroom-style seating.");
  add("7", 153, "Why should coffee service be extended?", ["Some attendees may arrive late.", "The hotel has changed its breakfast menu.", "A speaker requested extra time.", "The meeting will end later than expected."], "Some attendees may arrive late.", passage6, "Single Passage 2", "Several participants may arrive just before the first session.");
  add("7", 154, "What type of business is Harbor View Printing?", ["A shipping company", "A design school", "A printing service provider", "An office furniture store"], "A printing service provider", passage7, "Single Passage 3", "The advertisement describes printing services.");
  add("7", 155, "What is stated about most standard orders?", ["They include free design service.", "They are completed within two business days.", "They must be picked up in person.", "They require a minimum of 500 copies."], "They are completed within two business days.", passage7, "Single Passage 3", "The ad says most standard orders are completed within two business days.");
  add("7", 156, "How can new customers receive a discount?", ["By calling customer service", "By ordering before noon", "By entering a promotional code", "By visiting the store on a weekend"], "By entering a promotional code", passage7, "Single Passage 3", "Customers enter code NEW15 online.");
  add("7", 157, "What is true about the design service?", ["It is available for an extra charge.", "It is required for all brochure orders.", "It is free for returning customers.", "It is offered only in September."], "It is available for an extra charge.", passage7, "Single Passage 3", "The design team can create a layout for an additional fee.");
  add("7", 158, "What problem does Monica report?", ["Some produce is missing.", "The invoice is incorrect.", "A delivery driver arrived late.", "The lunch menu has changed."], "Some produce is missing.", passage8, "Single Passage 4", "Three boxes of tomatoes are missing.");
  add("7", 159, "How many boxes of tomatoes were delivered?", ["Three", "Seven", "Ten", "Thirteen"], "Seven", passage8, "Single Passage 4", "Monica says they received only seven.");
  add("7", 160, "What does Ravi ask Monica to do?", ["Prepare a new menu", "Contact another supplier", "Photograph the invoice and delivery area", "Return all the boxes"], "Photograph the invoice and delivery area", passage8, "Single Passage 4", "Ravi asks for photos of the invoice and delivery area.");
  add("7", 161, "Why are the tomatoes needed?", ["For a catering event tonight", "For tomorrow’s lunch special", "For a cooking class", "For a grocery display"], "For tomorrow’s lunch special", passage8, "Single Passage 4", "Monica says they need them for tomorrow’s lunch special.");
  add("7", 162, "Why is MapleSoft hiring additional staff?", ["It is opening a new headquarters.", "It has more software subscribers.", "It is replacing its accounting software.", "It plans to reduce evening support."], "It has more software subscribers.", passage9, "Single Passage 5", "The article mentions a 35 percent increase in subscriptions.");
  add("7", 163, "What will the new employees help improve?", ["Delivery speed", "Response times", "Office security", "Product packaging"], "Response times", passage9, "Single Passage 5", "The CEO says they will help reduce response times.");
  add("7", 164, "What is mentioned about the recruitment event?", ["It will be held online.", "It requires advance registration.", "It will take place at company headquarters.", "It is only for current employees."], "It will take place at company headquarters.", passage9, "Single Passage 5", "The event will be held at headquarters.");
  add("7", 165, "What are applicants encouraged to bring?", ["Software manuals", "Résumés", "Letters from customers", "Identification badges"], "Résumés", passage9, "Single Passage 5", "Applicants are encouraged to bring résumés.");
  add("7", 166, "Which workshop is taught by Thomas Hill?", ["Effective E-mail Writing", "Project Budget Basics", "Presentation Skills", "Customer Service Strategies"], "Project Budget Basics", passage10, "Single Passage 6", "The schedule lists Thomas Hill for Project Budget Basics.");
  add("7", 167, "Which workshop lasts the longest?", ["Effective E-mail Writing", "Project Budget Basics", "Presentation Skills", "Customer Service Strategies"], "Presentation Skills", passage10, "Single Passage 6", "Presentation Skills lasts from 10:00 A.M. to 3:00 P.M.");
  add("7", 168, "When does registration close?", ["One day before each workshop", "Three days before each workshop", "Five business days before each workshop", "On the morning of each workshop"], "Five business days before each workshop", passage10, "Single Passage 6", "The schedule states five business days before each workshop.");
  add("7", 169, "What will participants receive before the workshop?", ["Printed certificates", "Digital handouts", "Parking permits", "Discount coupons"], "Digital handouts", passage10, "Single Passage 6", "Participants receive digital handouts one day before.");
  add("7", 170, "What is the memo mainly about?", ["A new packing procedure", "A warehouse relocation", "A change in delivery fees", "A product recall"], "A new packing procedure", passage11, "Single Passage 7", "The memo announces a new packing procedure.");
  add("7", 171, "Where is the new material stored?", ["In the loading area", "Near Packing Station 3", "In the office supply room", "Beside the employee entrance"], "Near Packing Station 3", passage11, "Single Passage 7", "The material is stored near Packing Station 3.");
  add("7", 172, "What will happen on Monday and Tuesday?", ["Shift meetings will be canceled.", "Demonstrations will be given.", "All packages will be returned.", "Supervisors will change schedules."], "Demonstrations will be given.", passage11, "Single Passage 7", "A short demonstration will be given during shift meetings.");
  add("7", 173, "Why is the new material being used?", ["To reduce plastic waste", "To make packages heavier", "To lower product prices", "To increase storage space"], "To reduce plastic waste", passage11, "Single Passage 7", "The memo says the change is to reduce plastic waste.");
  add("7", 174, "What is Hannah Brooks planning?", ["A hotel renovation", "A two-day training program", "A customer appreciation dinner", "A sales presentation for clients"], "A two-day training program", passage12, "Double Passage 1", "She says she is organizing a two-day training program.");
  add("7", 175, "What does Hannah request?", ["Airport transportation", "A room with specific equipment", "Discounted hotel rooms", "Evening entertainment"], "A room with specific equipment", passage12, "Double Passage 1", "She requests a room with a projector, Internet, and group-work space.");
  add("7", 176, "What is stated about the Willow Room?", ["It can seat more than thirty people.", "It has fixed tables.", "It is available on the requested dates.", "It does not include Internet access."], "It is available on the requested dates.", passage12, "Double Passage 1", "The reply says the Willow Room is available on August 3 and 4.");
  add("7", 177, "How much is coffee service per person per day?", ["$8", "$18", "$25", "$30"], "$8", passage12, "Double Passage 1", "The reply says coffee service is $8 per person per day.");
  add("7", 178, "What must Ms. Brooks do by July 20?", ["Send a list of employee names", "Confirm the reservation", "Pay the full amount", "Choose a lunch menu"], "Confirm the reservation", passage12, "Double Passage 1", "She must confirm if she wants to reserve the room.");
  add("7", 179, "What is included with every rental?", ["A map and water bottle", "A helmet and lock", "A repair kit and basket", "A raincoat and gloves"], "A helmet and lock", passage13, "Double Passage 2", "The Web page states that all rentals include a helmet and lock.");
  add("7", 180, "How can customers reserve bicycles?", ["By visiting a travel agency", "By sending a fax", "Online", "Only in person"], "Online", passage13, "Double Passage 2", "Customers may reserve bicycles online.");
  add("7", 181, "What does Peter Lang want to change?", ["The number of bicycles", "The rental location", "The length of the rental", "The type of bicycle"], "The length of the rental", passage13, "Double Passage 2", "He wants to change from one day to three days.");
  add("7", 182, "What should the new total cost be?", ["$40", "$48", "$85", "$96"], "$96", passage13, "Double Passage 2", "Three days costs $48 per bicycle, so two bicycles cost $96.");
  add("7", 183, "According to the Web page, when can customers receive a full refund?", ["If they rent for more than three days", "If they cancel at least 24 hours in advance", "If they return the bicycles early", "If they reserve online"], "If they cancel at least 24 hours in advance", passage13, "Double Passage 2", "Cancellations at least 24 hours before the rental receive a full refund.");
  add("7", 184, "What is the announcement about?", ["A fundraising dinner", "A volunteer orientation", "An art competition", "A ticket price increase"], "A volunteer orientation", passage14, "Double Passage 3", "The announcement is for volunteer orientation.");
  add("7", 185, "Who is required to attend?", ["All returning volunteers", "All new volunteers", "All exhibition artists", "All visitors"], "All new volunteers", passage14, "Double Passage 3", "Attendance is required for all new volunteers.");
  add("7", 186, "Why does Claire say she does not have to attend?", ["She is not interested in exhibitions.", "She has another meeting at that time.", "She volunteered last year.", "She works at the ticket desk full-time."], "She volunteered last year.", passage14, "Double Passage 3", "Claire says she volunteered last year.");
  add("7", 187, "What does Claire ask Maya to do?", ["Bring refreshments", "Buy tickets", "Take notes about procedure changes", "Prepare an exhibition schedule"], "Take notes about procedure changes", passage14, "Double Passage 3", "Claire asks Maya to take notes about changes.");
  add("7", 188, "What topic is Maya specifically asked to pay attention to?", ["Visitor check-in procedures", "Artist payment policies", "Parking fees", "Catering arrangements"], "Visitor check-in procedures", passage14, "Double Passage 3", "Claire mentions visitor check-in procedures.");
  add("7", 189, "What type of business most likely placed the order?", ["A café", "A hotel", "A clothing store", "A shipping company"], "A café", passage15, "Triple Passage 1", "The customer is Willow Creek Café.");
  add("7", 190, "What was the total price of the order?", ["$240", "$390", "$500", "$590"], "$590", passage15, "Triple Passage 1", "$240 + $150 + $200 = $590.");
  add("7", 191, "Why was shipping free?", ["The customer used a coupon.", "The order was placed in November.", "The order was over $500.", "The shipment was delayed."], "The order was over $500.", passage15, "Triple Passage 1", "Shipping is free for orders over $500.");
  add("7", 192, "What problem does Nina Shah report?", ["Some mugs were broken.", "Teaspoons were missing.", "The napkins were not delivered.", "The order number was incorrect."], "The napkins were not delivered.", passage15, "Triple Passage 1", "The e-mail says the napkins were not included.");
  add("7", 193, "When are the napkins expected to arrive at Willow Creek Café?", ["November 8", "November 10", "November 12", "November 15"], "November 12", passage15, "Triple Passage 1", "The reply says the café should receive them by November 12.");
  add("7", 194, "Why does Willow Creek Café need the napkins before November 15?", ["For a private dinner event", "For a staff training session", "For a restaurant inspection", "For a product photo shoot"], "For a private dinner event", passage15, "Triple Passage 1", "Nina says they are needed before a private dinner event.");
  add("7", 195, "What position is being advertised?", ["Legal researcher", "Office coordinator", "Administrative assistant", "Supply manager"], "Administrative assistant", passage16, "Triple Passage 2", "The posting is for an administrative assistant.");
  add("7", 196, "What is one responsibility of the position?", ["Representing clients in court", "Scheduling appointments", "Preparing tax reports", "Designing advertisements"], "Scheduling appointments", passage16, "Triple Passage 2", "The posting lists scheduling appointments.");
  add("7", 197, "What is required of applicants?", ["A law degree", "Legal office experience", "At least two years of office experience", "Experience in accounting software"], "At least two years of office experience", passage16, "Triple Passage 2", "The posting says applicants should have at least two years of office experience.");
  add("7", 198, "Where does Olivia Grant currently work?", ["Benton Legal Services", "Mason Accounting", "A downtown court office", "A supply company"], "Mason Accounting", passage16, "Triple Passage 2", "Olivia says she works at Mason Accounting.");
  add("7", 199, "What does Mark Ellison say about Olivia Grant?", ["She should not be considered.", "She lacks all required experience.", "She has legal office experience.", "She is a strong candidate."], "She is a strong candidate.", passage16, "Triple Passage 2", "Mark says she looks like a strong candidate.");
  add("7", 200, "What will probably happen next?", ["Olivia will be invited for an interview.", "The job posting will be canceled.", "Rachel will order office supplies.", "Mark will rewrite Olivia's resume."], "Olivia will be invited for an interview.", passage16, "Triple Passage 2", "Mark recommends inviting her for an interview.");

  window.TOEIC_READING_EXAMS.y2017 = {
    meta: {
        "id": "y2017",
        "label": "TOEIC Reading 2017",
        "company": "Metroline Business Center",
        "place": "Boston",
        "event": "regional sales workshop",
        "product": "copy machine",
        "department": "administration",
        "service": "mailroom service",
        "theme": "office administration and business travel"
    },
    questions
  };
})();
