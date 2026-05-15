// TOEIC Reading 2018 data.
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
To: All Department Managers
From: Facilities Office
Subject: Weekend Air-Conditioning Work

Dear Managers,

Please be advised that maintenance technicians will inspect and repair the air-conditioning system this Saturday from 7:00 A.M. to 1:00 P.M. During this period, access to floors 4 through 6 will be limited.

If your team needs to retrieve documents from those floors, please do so by Friday afternoon. Security staff will be available to assist anyone ------- (31) access to essential materials during the maintenance period.

We expect the work to be completed on schedule. ------- (32), employees should not plan to work in the affected areas on Saturday morning.

------- (33) Thank you for your cooperation.

Facilities Office`;

  const passage2 = `Notice

Customer Notice: Extended Service Hours

Beginning June 5, Westlake Bank will extend the hours of its customer support line. Representatives will now be available from 7:00 A.M. to 9:00 P.M., Monday through Friday.

This change was made in response to customer feedback ------- (35) during our recent service survey. Many customers said they needed assistance outside regular business hours.

Online banking services will continue to be available twenty-four hours a day. ------- (36), customers who need help resetting passwords may now speak with a representative later in the evening.

------- (37)`;

  const passage3 = `Article

New Distribution Center Opens in Riverton

BrightPath Logistics opened a new distribution center in Riverton on Monday. The 80,000-square-foot facility will allow the company to handle a larger volume of orders and reduce shipping times for customers in the region.

The center is equipped with automated sorting machines that can process packages more ------- (39) than older equipment. According to regional manager Dana Ortiz, the facility will create approximately forty new jobs over the next year.

BrightPath chose Riverton because of its ------- (40) location near two major highways and a freight rail line.

------- (41) The company expects the new center to be fully operational by the end of the month.`;

  const passage4 = `E-mail
To: Priya Nair
From: Ken Wallace
Subject: Catering Estimate

Dear Ms. Nair,

Thank you for considering Bayview Catering for your employee recognition luncheon. Based on the information you provided, I have prepared an estimate for 75 guests on August 18.

The estimate includes a buffet lunch, beverages, table linens, and service staff. Dessert can be added for an ------- (43) charge of $4 per person.

If the number of guests changes, please notify us at least five business days before the event. ------- (44), we may not be able to adjust the food order in time.

------- (45) I have attached the detailed estimate for your review.

Sincerely,
Ken Wallace
Event Coordinator`;

  const passage5 = `Notice

Parking Garage Cleaning

The parking garage at Mason Corporate Center will be cleaned on Sunday, February 11, from 6:00 A.M. to 4:00 P.M. Vehicles must be removed from levels B2 and B3 before 6:00 A.M.

Employees who need to park on-site during the cleaning may use the visitor parking area on the first level. Normal parking arrangements will resume on Monday morning.

Questions should be directed to the building management office.`;

  const passage6 = `E-mail
To: Research Team
From: Dr. Helen Moore
Subject: Lab Schedule Next Week

Dear Team,

Because the new testing equipment will be installed on Tuesday morning, Lab 2 will not be available until 1:00 P.M. that day. Any experiments scheduled for Tuesday morning should be moved to Lab 1 or postponed until later in the week.

Please update the shared calendar by Monday at noon so that everyone can see the revised schedule. The equipment supplier will provide a short orientation session on Wednesday at 10:00 A.M. Attendance is strongly recommended for anyone who will use the new machine.

Thank you,
Helen`;

  const passage7 = `Advertisement

ClearView Window Cleaning

ClearView provides professional window cleaning for offices, restaurants, and retail stores. Our trained staff use environmentally friendly cleaning products and flexible scheduling to minimize disruption to your business.

First-time commercial customers receive 10 percent off any service package booked before May 31. Regular monthly service plans are also available.

To request a free estimate, complete the form at www.clearviewclean.com or call 555-0137.`;

  const passage8 = `Text-Message Chain

Lena: Mark, did the projector arrive for tomorrow’s client presentation?
Mark: Yes, but the carrying case was not included.
Lena: We will need it because the presentation is at the client’s office.
Mark: I called the supplier. They said the case was shipped separately and should arrive by 3:00 P.M. today.
Lena: Great. Please test the projector once the case arrives.
Mark: Sure. I’ll also pack the extra cables.`;

  const passage9 = `Article

Bakery Adds Online Ordering System

Sweet Corner Bakery has introduced an online ordering system for cakes, pastries, and catering trays. Customers can now select items, choose pickup times, and pay through the bakery’s Web site.

Owner Carla Reyes said the system was created after customers requested a faster way to place large orders. “During the holidays, our phone lines were constantly busy,” Reyes said. “This system will make ordering easier for everyone.”

For the first two weeks, customers who place online orders of $50 or more will receive a free box of cookies.`;

  const passage10 = `Schedule

Riverside Business Center — Seminar Schedule

Date | Seminar | Time | Room
March 5 | Social Media for Small Businesses | 9:00 A.M.–11:30 A.M. | 204
March 8 | Managing Remote Teams | 1:00 P.M.–4:00 P.M. | 301
March 14 | Basic Contract Review | 10:00 A.M.–12:00 P.M. | 204
March 21 | Building Customer Loyalty | 2:00 P.M.–5:00 P.M. | 115

Participants must register at least three days before each seminar. Printed materials will be available at the registration desk.`;

  const passage11 = `Memo

To: All Store Employees
From: Victor Chen, Store Manager
Subject: Product Display Update

Starting next Monday, all seasonal products will be displayed near the front entrance. The change is intended to make promotional items more visible to customers.

Please remove the current display by Sunday evening and place all remaining winter items in the clearance section. The visual merchandising team will arrive Monday morning to set up the spring display.

If customers ask about winter items, direct them to the clearance section at the back of the store.`;

  const passage12 = `E-mail

To: Billing Department, Northstar Office Furniture
From: Grace Miller, Dalton Consulting
Subject: Invoice 7732

Hello,

We received invoice 7732 for the conference table delivered to our office last week. The table arrived on time and is in excellent condition. However, the invoice includes a $60 assembly fee.

When I placed the order, I was told that assembly would be free because the table cost more than $900. Could you please review the invoice and send a corrected version if necessary?

Thank you,
Grace Miller

Invoice

Northstar Office Furniture
Invoice No. 7732
Customer: Dalton Consulting

Item | Price
Large Conference Table | $950
Delivery Fee | $40
Assembly Fee | $60
Total | $1,050

Note: Assembly is free for furniture purchases over $900.`;

  const passage13 = `Web Page

Oakridge Training Institute — Course Descriptions

Time Management Essentials
A one-day workshop for professionals who want to organize tasks, set priorities, and reduce missed deadlines.

Effective Business Writing
A two-day course covering e-mail writing, report structure, and editing techniques.

Negotiation Skills for Managers
A one-day seminar focusing on vendor discussions, contract terms, and conflict resolution.

Group discounts are available for organizations registering five or more employees for the same course.

E-mail

To: Oakridge Training Institute
From: Samuel Price
Subject: Course Recommendation

Hello,

I manage a small purchasing team. We often meet with suppliers to discuss prices and contract conditions. I would like to register six team members for a course that will help them communicate more effectively during these discussions.

Could you recommend the most suitable course and let me know whether we qualify for a discount?

Regards,
Samuel Price`;

  const passage14 = `Advertisement

GreenLine Commuter Pass

The GreenLine Commuter Pass allows unlimited bus rides within the city for one month. The pass costs $68 and can be purchased online or at any GreenLine service counter.

Employers purchasing ten or more passes for employees receive a 12 percent discount. Passes become active on the first day they are used.

E-mail

To: GreenLine Customer Service
From: Nina Patel, Office Administrator
Subject: Commuter Passes

Hello,

Our company is considering buying monthly commuter passes for twelve employees who use the bus to travel to work. Before I place the order, could you confirm the total cost after the employer discount? Also, please let me know whether the passes must all begin on the same date.

Thank you,
Nina Patel

Reply

Dear Ms. Patel,

Thank you for your inquiry. Since you plan to purchase twelve passes, your company qualifies for the 12 percent employer discount. The total after the discount will be $718.08.

The passes do not need to begin on the same date. Each pass becomes active the first time it is used.

Best regards,
Joel Kim
GreenLine Customer Service`;

  const passage15 = `Company Announcement

New Employee Wellness Program

Carter & Lowe will begin a wellness program on September 1. Employees may attend free lunchtime fitness classes every Tuesday and Thursday in the multipurpose room. The company will also provide monthly nutrition workshops led by local health professionals.

Employees who attend at least eight fitness classes during September will receive a $25 gift card.

E-mail

To: Human Resources
From: Daniel Ruiz
Subject: Wellness Program Question

Hello,

I would like to participate in the wellness program, but I work at the West Office and cannot travel to headquarters during lunch. Will any online options be available for employees at other locations?

Also, do nutrition workshops count toward the eight-class requirement for the gift card?

Thanks,
Daniel Ruiz

Reply

Dear Daniel,

Thank you for your interest. We will record the nutrition workshops and make them available online. However, the lunchtime fitness classes will be held in person only during the first month of the program.

The gift card is awarded only to employees who attend at least eight fitness classes in September. Nutrition workshops do not count toward that requirement.

Best,
Maya Singh
Human Resources`;

  add("5", 101, "The revised safety guidelines will be posted on the company intranet ------- the end of the day.", ["by", "into", "among", "across"], "by", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 102, "Mr. Jensen asked the interns to submit their weekly reports ------- before leaving the office on Friday.", ["complete", "completed", "completing", "completion"], "completed", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 103, "The customer service desk is open ------- 8:30 A.M. to 6:00 P.M. on weekdays.", ["during", "from", "among", "through"], "from", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 104, "The new mobile app allows users to check account balances ------- and securely.", ["convenient", "convenience", "conveniently", "conveniences"], "conveniently", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 105, "------- the heavy rain, all outdoor activities at the company retreat were moved indoors.", ["Because of", "Although", "Even if", "In order to"], "Because of", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 106, "The finance director approved the purchase only after the vendor provided a ------- price estimate.", ["detail", "detailed", "details", "detailing"], "detailed", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 107, "Employees are encouraged to ------- unused office supplies to the storage cabinet.", ["return", "returning", "returned", "returns"], "return", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 108, "The training seminar was so ------- that the company plans to offer it again next quarter.", ["success", "successful", "successfully", "succeed"], "successful", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 109, "The project manager will contact you ------- further information is required.", ["if", "before", "yet", "unless"], "if", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 110, "The marketing proposal contains several recommendations ------- increasing brand awareness.", ["for", "into", "below", "unlike"], "for", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 111, "Due to the high number of applications, only ------- candidates will be invited for interviews.", ["select", "selected", "selecting", "selection"], "selected", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 112, "The company has decided to ------- its warehouse operations to improve delivery speed.", ["expand", "expansion", "expansive", "expanded"], "expand", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 113, "The reception area was recently renovated to make it more ------- for visitors.", ["welcoming", "welcome", "welcomed", "welcomes"], "welcoming", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 114, "The annual budget meeting has been postponed ------- the chief financial officer is traveling this week.", ["because", "instead", "otherwise", "despite"], "because", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 115, "All conference participants must register online ------- they can receive their identification badges.", ["so that", "even though", "rather than", "in case of"], "so that", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 116, "The restaurant’s new ordering system has ------- reduced wait times during lunch hours.", ["significant", "significance", "significantly", "signify"], "significantly", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 117, "Please read the instructions ------- before assembling the office chair.", ["care", "careful", "carefully", "carefulness"], "carefully", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 118, "The company newsletter is sent to employees ------- the first Monday of each month.", ["on", "at", "over", "beside"], "on", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 119, "The laptop warranty covers repairs ------- by manufacturing defects.", ["caused", "causing", "cause", "causes"], "caused", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 120, "The new branch office is ------- located near several major transportation routes.", ["convenience", "convenient", "conveniently", "conveniences"], "conveniently", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 121, "The supervisor requested that the shipment ------- inspected before it is sent to the client.", ["be", "is", "was", "has"], "be", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 122, "Ms. Lee was promoted because of her ------- to improving customer satisfaction.", ["commit", "committed", "commitment", "committing"], "commitment", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 123, "The hotel offers discounted rates to guests ------- reservations are made at least two weeks in advance.", ["who", "whose", "whom", "which"], "whose", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 124, "The software engineer found an error in the program and corrected it -------.", ["immediate", "immediately", "immediacy", "more immediate"], "immediately", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 125, "The contract will not become valid ------- both parties have signed it.", ["until", "whereas", "while", "besides"], "until", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 126, "The board reviewed the proposal ------- making its final decision.", ["prior to", "except for", "due to", "according to"], "prior to", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 127, "We are looking for a supplier ------- can deliver replacement parts within twenty-four hours.", ["whose", "who", "that", "what"], "that", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 128, "The company’s profits increased ------- during the second quarter.", ["steadiness", "steadily", "steady", "steadied"], "steadily", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 129, "Please leave a message with the receptionist if Mr. Howard is ------- when you call.", ["unavailable", "available", "availability", "availably"], "unavailable", null, null, "Correct answer from the supplied 2018 answer key.");
  add("5", 130, "The operations team is responsible for ensuring that all deliveries arrive ------- schedule.", ["ahead of", "along", "between", "off"], "ahead of", null, null, "Correct answer from the supplied 2018 answer key.");
  add("6", 131, "Choose the best answer for blank 31.", ["need", "needs", "needed", "needing"], "needing", passage1, "Text 1", "Correct answer from the supplied 2018 answer key.");
  add("6", 132, "Choose the best answer for blank 32.", ["Therefore", "Nevertheless", "For instance", "Similarly"], "Nevertheless", passage1, "Text 1", "Correct answer from the supplied 2018 answer key.");
  add("6", 133, "Choose the sentence that best completes blank 33.", ["The cafeteria will introduce a new lunch menu next week.", "Please contact the Facilities Office if you have questions.", "The finance team will review the annual budget soon.", "Employees may register for the training course online."], "Please contact the Facilities Office if you have questions.", passage1, "Text 1", "Correct answer from the supplied 2018 answer key.");
  add("6", 134, "What is the purpose of the e-mail?", ["To explain a weekend maintenance schedule", "To announce a new security policy", "To invite managers to a training session", "To request budget documents"], "To explain a weekend maintenance schedule", passage1, "Text 1", "Correct answer from the supplied 2018 answer key.");
  add("6", 135, "Choose the best answer for blank 35.", ["collect", "collecting", "collected", "collection"], "collected", passage2, "Text 2", "Correct answer from the supplied 2018 answer key.");
  add("6", 136, "Choose the best answer for blank 36.", ["In addition", "Despite", "Instead of", "Unless"], "In addition", passage2, "Text 2", "Correct answer from the supplied 2018 answer key.");
  add("6", 137, "Choose the sentence that best completes blank 37.", ["We appreciate your continued business.", "The bank will close all branches permanently.", "Customers must apply for new account numbers.", "The survey will be canceled next month."], "We appreciate your continued business.", passage2, "Text 2", "Correct answer from the supplied 2018 answer key.");
  add("6", 138, "Why is Westlake Bank extending service hours?", ["It is opening new branches.", "Customers requested more support availability.", "It will stop offering online banking.", "Representatives asked for shorter shifts."], "Customers requested more support availability.", passage2, "Text 2", "Correct answer from the supplied 2018 answer key.");
  add("6", 139, "Choose the best answer for blank 39.", ["efficient", "efficiently", "efficiency", "efficiencies"], "efficiently", passage3, "Text 3", "Correct answer from the supplied 2018 answer key.");
  add("6", 140, "Choose the best answer for blank 40.", ["strategy", "strategic", "strategically", "strategize"], "strategic", passage3, "Text 3", "Correct answer from the supplied 2018 answer key.");
  add("6", 141, "Choose the sentence that best completes blank 41.", ["Local officials attended a ribbon-cutting ceremony.", "Customers must pick up all packages in person.", "The company closed its Web site last week.", "The sorting machines will be sold to another firm."], "Local officials attended a ribbon-cutting ceremony.", passage3, "Text 3", "Correct answer from the supplied 2018 answer key.");
  add("6", 142, "What is the article mainly about?", ["A logistics company’s new facility", "A highway construction project", "A change in package prices", "A rail service cancellation"], "A logistics company’s new facility", passage3, "Text 3", "Correct answer from the supplied 2018 answer key.");
  add("6", 143, "Choose the best answer for blank 43.", ["addition", "additionally", "additional", "additions"], "additional", passage4, "Text 4", "Correct answer from the supplied 2018 answer key.");
  add("6", 144, "Choose the best answer for blank 44.", ["Otherwise", "However", "For example", "Meanwhile"], "Otherwise", passage4, "Text 4", "Correct answer from the supplied 2018 answer key.");
  add("6", 145, "Choose the sentence that best completes blank 45.", ["Please see the attachment for itemized pricing.", "The luncheon was canceled yesterday.", "Our office is closed every August.", "The guest list has already been printed."], "Please see the attachment for itemized pricing.", passage4, "Text 4", "Correct answer from the supplied 2018 answer key.");
  add("6", 146, "What is the purpose of the e-mail?", ["To confirm a hotel reservation", "To provide a catering estimate", "To request employee nominations", "To announce a restaurant opening"], "To provide a catering estimate", passage4, "Text 4", "Correct answer from the supplied 2018 answer key.");
  add("7", 147, "What is the notice mainly about?", ["A parking garage cleaning", "A new employee parking fee", "A visitor registration procedure", "A change in building entrances"], "A parking garage cleaning", passage5, "Single Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 148, "When will the cleaning take place?", ["On Monday morning", "On Sunday, February 11", "Every weekday in February", "After 4:00 P.M. on Friday"], "On Sunday, February 11", passage5, "Single Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 149, "What must employees do before 6:00 A.M.?", ["Contact building security", "Remove vehicles from two levels", "Pick up new parking passes", "Reserve visitor spaces online"], "Remove vehicles from two levels", passage5, "Single Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 150, "Where may employees park during the cleaning?", ["On levels B2 and B3", "In the loading dock", "In the visitor parking area", "Across the street only"], "In the visitor parking area", passage5, "Single Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 151, "Why will Lab 2 be unavailable on Tuesday morning?", ["It will be cleaned.", "New equipment will be installed.", "A safety inspection will take place.", "The electricity will be shut off."], "New equipment will be installed.", passage6, "Single Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 152, "What should team members update?", ["A supply order", "A shared calendar", "A research report", "A training manual"], "A shared calendar", passage6, "Single Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 153, "When is the orientation session scheduled?", ["Monday at noon", "Tuesday morning", "Wednesday at 10:00 A.M.", "Friday afternoon"], "Wednesday at 10:00 A.M.", passage6, "Single Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 154, "Who should attend the orientation session?", ["Anyone who will use the new machine", "Only equipment suppliers", "All building visitors", "Only Dr. Moore"], "Anyone who will use the new machine", passage6, "Single Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 155, "What service does ClearView provide?", ["Carpet installation", "Window cleaning", "Office furniture repair", "Restaurant delivery"], "Window cleaning", passage7, "Single Passage 3", "Correct answer from the supplied 2018 answer key.");
  add("7", 156, "What is mentioned about ClearView’s products?", ["They are imported from overseas.", "They are environmentally friendly.", "They are sold in retail stores.", "They require special training to purchase."], "They are environmentally friendly.", passage7, "Single Passage 3", "Correct answer from the supplied 2018 answer key.");
  add("7", 157, "Who can receive a discount?", ["First-time commercial customers", "Customers who pay in cash", "Residential customers only", "Employees of retail stores"], "First-time commercial customers", passage7, "Single Passage 3", "Correct answer from the supplied 2018 answer key.");
  add("7", 158, "How can customers request a free estimate?", ["By visiting the office in person only", "By completing an online form or calling", "By sending a printed coupon", "By booking monthly service first"], "By completing an online form or calling", passage7, "Single Passage 3", "Correct answer from the supplied 2018 answer key.");
  add("7", 159, "What is the problem with the delivery?", ["The projector does not work.", "The carrying case is missing.", "The supplier sent the wrong cables.", "The package arrived at the wrong office."], "The carrying case is missing.", passage8, "Single Passage 4", "Correct answer from the supplied 2018 answer key.");
  add("7", 160, "Why is the carrying case needed?", ["The presentation will be held at a client’s office.", "The projector will be returned to the supplier.", "The company is selling the projector.", "The cables must be stored permanently."], "The presentation will be held at a client’s office.", passage8, "Single Passage 4", "Correct answer from the supplied 2018 answer key.");
  add("7", 161, "What did the supplier say?", ["The projector must be replaced.", "The case was shipped separately.", "The delivery has been canceled.", "The client already received the case."], "The case was shipped separately.", passage8, "Single Passage 4", "Correct answer from the supplied 2018 answer key.");
  add("7", 162, "What will Mark do after the case arrives?", ["Cancel the presentation", "Test the projector", "Call the client to reschedule", "Order a new projector"], "Test the projector", passage8, "Single Passage 4", "Correct answer from the supplied 2018 answer key.");
  add("7", 163, "What has Sweet Corner Bakery introduced?", ["A delivery truck", "An online ordering system", "A new holiday menu only", "A customer loyalty card"], "An online ordering system", passage9, "Single Passage 5", "Correct answer from the supplied 2018 answer key.");
  add("7", 164, "Why was the system created?", ["Customers wanted a faster way to order.", "The bakery moved to another location.", "The bakery stopped taking phone calls.", "Employees requested shorter hours."], "Customers wanted a faster way to order.", passage9, "Single Passage 5", "Correct answer from the supplied 2018 answer key.");
  add("7", 165, "What can customers choose through the Web site?", ["Employee uniforms", "Pickup times", "Bakery decorations", "Supplier contracts"], "Pickup times", passage9, "Single Passage 5", "Correct answer from the supplied 2018 answer key.");
  add("7", 166, "What will some customers receive during the first two weeks?", ["Free coffee", "A free box of cookies", "A discount on all orders", "A catering tray"], "A free box of cookies", passage9, "Single Passage 5", "Correct answer from the supplied 2018 answer key.");
  add("7", 167, "Which seminar is held in Room 301?", ["Social Media for Small Businesses", "Managing Remote Teams", "Basic Contract Review", "Building Customer Loyalty"], "Managing Remote Teams", passage10, "Single Passage 6", "Correct answer from the supplied 2018 answer key.");
  add("7", 168, "Which seminar begins at 10:00 A.M.?", ["Social Media for Small Businesses", "Managing Remote Teams", "Basic Contract Review", "Building Customer Loyalty"], "Basic Contract Review", passage10, "Single Passage 6", "Correct answer from the supplied 2018 answer key.");
  add("7", 169, "When must participants register?", ["At least three days before each seminar", "On the day of the seminar", "One week after the seminar", "By the end of March"], "At least three days before each seminar", passage10, "Single Passage 6", "Correct answer from the supplied 2018 answer key.");
  add("7", 170, "Where will printed materials be available?", ["In Room 115 only", "At the registration desk", "At the parking office", "On the company Web site only"], "At the registration desk", passage10, "Single Passage 6", "Correct answer from the supplied 2018 answer key.");
  add("7", 171, "What is the purpose of the change?", ["To reduce staff hours", "To make promotional items more visible", "To close the store entrance", "To increase prices of winter items"], "To make promotional items more visible", passage11, "Single Passage 7", "Correct answer from the supplied 2018 answer key.");
  add("7", 172, "When should the current display be removed?", ["By Sunday evening", "On Monday afternoon", "At the end of next month", "After the spring display is finished"], "By Sunday evening", passage11, "Single Passage 7", "Correct answer from the supplied 2018 answer key.");
  add("7", 173, "Who will set up the spring display?", ["The accounting department", "The delivery team", "The visual merchandising team", "The customers"], "The visual merchandising team", passage11, "Single Passage 7", "Correct answer from the supplied 2018 answer key.");
  add("7", 174, "Where will winter items be placed?", ["Near the cash registers", "In the clearance section", "In the front window", "In the storage office"], "In the clearance section", passage11, "Single Passage 7", "Correct answer from the supplied 2018 answer key.");
  add("7", 175, "What item did Dalton Consulting purchase?", ["A filing cabinet", "A conference table", "Office chairs", "A reception desk"], "A conference table", passage12, "Double Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 176, "What does Grace Miller say about the table?", ["It arrived damaged.", "It was delivered late.", "It is in excellent condition.", "It was the wrong size."], "It is in excellent condition.", passage12, "Double Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 177, "Why does Grace question the invoice?", ["The delivery fee is too low.", "The table price is missing.", "An assembly fee was included.", "The invoice number is incorrect."], "An assembly fee was included.", passage12, "Double Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 178, "According to the invoice note, why should assembly be free?", ["The purchase was over $900.", "The customer ordered two tables.", "The delivery was delayed.", "The order was placed online."], "The purchase was over $900.", passage12, "Double Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 179, "What should the corrected total be?", ["$950", "$990", "$1,010", "$1,050"], "$990", passage12, "Double Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 180, "What does Grace request?", ["A replacement table", "A new delivery date", "A corrected invoice", "A product catalog"], "A corrected invoice", passage12, "Double Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 181, "What does the Time Management Essentials course help participants do?", ["Prepare financial statements", "Organize tasks and set priorities", "Negotiate contract terms", "Design product packaging"], "Organize tasks and set priorities", passage13, "Double Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 182, "How long is the Effective Business Writing course?", ["Half a day", "One day", "Two days", "One week"], "Two days", passage13, "Double Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 183, "Which course is most suitable for Samuel’s team?", ["Time Management Essentials", "Effective Business Writing", "Negotiation Skills for Managers", "Editing Techniques for Writers"], "Negotiation Skills for Managers", passage13, "Double Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 184, "Why does Samuel’s team meet with suppliers?", ["To discuss prices and contract conditions", "To inspect office equipment", "To arrange employee vacations", "To write customer newsletters"], "To discuss prices and contract conditions", passage13, "Double Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 185, "How many employees does Samuel want to register?", ["Two", "Five", "Six", "Ten"], "Six", passage13, "Double Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 186, "What is true about the discount?", ["Samuel’s organization likely qualifies for it.", "It is available only for writing courses.", "It requires ten or more employees.", "It applies only to online registration."], "Samuel’s organization likely qualifies for it.", passage13, "Double Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 187, "What does the GreenLine Commuter Pass allow customers to do?", ["Ride buses without limit within the city for one month", "Reserve parking spaces downtown", "Travel by train between cities", "Receive free taxi service"], "Ride buses without limit within the city for one month", passage14, "Triple Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 188, "How much does one pass cost before any discount?", ["$12", "$68", "$718.08", "$816"], "$68", passage14, "Triple Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 189, "Why does Nina Patel contact GreenLine?", ["To report a lost bus pass", "To ask about a group purchase", "To complain about bus schedules", "To change a service counter location"], "To ask about a group purchase", passage14, "Triple Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 190, "How many passes does Nina’s company plan to buy?", ["Ten", "Eleven", "Twelve", "Eighteen"], "Twelve", passage14, "Triple Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 191, "Why does the company qualify for a discount?", ["It is buying more than one type of pass.", "It is purchasing at least ten passes.", "It has used GreenLine for more than a year.", "It is paying at a service counter."], "It is purchasing at least ten passes.", passage14, "Triple Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 192, "What is the total cost after the discount?", ["$68", "$598.40", "$718.08", "$816"], "$718.08", passage14, "Triple Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 193, "What is stated about the passes?", ["They must all begin on the same date.", "They become active the first time they are used.", "They are valid for one week only.", "They can be used for train travel."], "They become active the first time they are used.", passage14, "Triple Passage 1", "Correct answer from the supplied 2018 answer key.");
  add("7", 194, "When will the wellness program begin?", ["August 1", "September 1", "September 8", "October 1"], "September 1", passage15, "Triple Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 195, "Where will the fitness classes be held?", ["At the West Office", "At a local gym", "In the multipurpose room", "Online only"], "In the multipurpose room", passage15, "Triple Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 196, "What will employees receive if they attend at least eight fitness classes in September?", ["A free lunch", "A $25 gift card", "A health insurance discount", "A nutrition textbook"], "A $25 gift card", passage15, "Triple Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 197, "Why does Daniel contact Human Resources?", ["He wants to lead a workshop.", "He cannot travel to headquarters during lunch.", "He lost his gift card.", "He wants to cancel the program."], "He cannot travel to headquarters during lunch.", passage15, "Triple Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 198, "What will be available online?", ["Recordings of nutrition workshops", "Tuesday fitness classes", "Thursday fitness classes", "Gift card applications"], "Recordings of nutrition workshops", passage15, "Triple Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 199, "What does Maya Singh say about the fitness classes?", ["They will be recorded every week.", "They will be held in person only during the first month.", "They will take place at all office locations.", "They will replace the nutrition workshops."], "They will be held in person only during the first month.", passage15, "Triple Passage 2", "Correct answer from the supplied 2018 answer key.");
  add("7", 200, "What does NOT count toward the gift card requirement?", ["September fitness classes", "Tuesday classes", "Thursday classes", "Nutrition workshops"], "Nutrition workshops", passage15, "Triple Passage 2", "Correct answer from the supplied 2018 answer key.");

  const q = (questionNo, data) => Object.assign(questions.find((item) => item.questionNo === questionNo) || {}, data);
  const genericWrong = "Các lựa chọn còn lại sai vì không khớp ngữ pháp, cấu trúc cố định hoặc thông tin được nêu trực tiếp trong câu/bài.";

  [
    [101, "The revised safety guidelines will be posted on the company intranet by the end of the day.", "by the end of the day là cụm chỉ hạn chót, nghĩa là muộn nhất trước cuối ngày.", "across/into/among không dùng để chỉ hạn chót thời gian.", "Các hướng dẫn an toàn đã sửa đổi sẽ được đăng trên mạng nội bộ công ty muộn nhất vào cuối ngày."],
    [102, "Mr. Jensen asked the interns to submit their weekly reports completed before leaving the office on Friday.", "completed đóng vai trò bổ nghĩa cho reports, diễn tả các báo cáo đã được hoàn thành trước khi rời văn phòng.", "complete/completing/completion không đúng dạng cần dùng sau danh từ reports trong ngữ cảnh này.", "Ông Jensen yêu cầu các thực tập sinh nộp báo cáo hằng tuần đã hoàn thành trước khi rời văn phòng vào thứ Sáu."],
    [103, "The customer service desk is open from 8:30 A.M. to 6:00 P.M. on weekdays.", "Cấu trúc đúng là from A to B, nghĩa là từ A đến B.", "through/during/among không đi với to trong cấu trúc giờ mở cửa này.", "Quầy dịch vụ khách hàng mở cửa từ 8:30 sáng đến 6:00 chiều vào các ngày trong tuần."],
    [104, "The new mobile app allows users to check account balances conveniently and securely.", "check là động từ nên cần trạng từ conveniently để bổ nghĩa song song với securely.", "convenient là tính từ, convenience/conveniences là danh từ nên sai vị trí.", "Ứng dụng di động mới cho phép người dùng kiểm tra số dư tài khoản một cách thuận tiện và an toàn."],
    [105, "Because of the heavy rain, all outdoor activities at the company retreat were moved indoors.", "Because of đi với danh từ/cụm danh từ; the heavy rain là cụm danh từ.", "Although/Even if cần mệnh đề đầy đủ; In order to chỉ mục đích và theo sau là động từ.", "Vì trời mưa lớn, tất cả hoạt động ngoài trời trong chuyến nghỉ dưỡng công ty đã được chuyển vào trong nhà."],
    [106, "The finance director approved the purchase only after the vendor provided a detailed price estimate.", "Trước price estimate cần tính từ; detailed nghĩa là chi tiết.", "detail/details là danh từ, detailing là V-ing nên không tự nhiên ở vị trí này.", "Giám đốc tài chính chỉ phê duyệt việc mua hàng sau khi nhà cung cấp đưa ra bản ước tính giá chi tiết."],
    [107, "Employees are encouraged to return unused office supplies to the storage cabinet.", "Sau be encouraged to dùng động từ nguyên mẫu: to return.", "returning/returned/returns sai dạng sau to.", "Nhân viên được khuyến khích trả lại vật dụng văn phòng chưa dùng vào tủ lưu trữ."],
    [108, "The training seminar was so successful that the company plans to offer it again next quarter.", "Cấu trúc so + adjective + that cần tính từ successful sau was.", "success là danh từ, successfully là trạng từ, succeed là động từ.", "Buổi hội thảo đào tạo thành công đến mức công ty dự định tổ chức lại vào quý tới."],
    [109, "The project manager will contact you if further information is required.", "if diễn tả điều kiện: nếu cần thêm thông tin thì quản lý dự án sẽ liên hệ.", "before/yet/unless không diễn tả đúng điều kiện này.", "Quản lý dự án sẽ liên hệ với bạn nếu cần thêm thông tin."],
    [110, "The marketing proposal contains several recommendations for increasing brand awareness.", "recommendations for + V-ing/noun nghĩa là các đề xuất cho việc gì.", "into/below/unlike không đi với recommendations trong nghĩa này.", "Bản đề xuất marketing có một số khuyến nghị nhằm tăng nhận diện thương hiệu."],
    [111, "Due to the high number of applications, only selected candidates will be invited for interviews.", "selected candidates nghĩa là những ứng viên được chọn.", "select/selecting/selection không phải tính từ/phân từ phù hợp trước candidates.", "Do số lượng đơn ứng tuyển lớn, chỉ ứng viên được chọn mới được mời phỏng vấn."],
    [112, "The company has decided to expand its warehouse operations to improve delivery speed.", "Sau decide to dùng động từ nguyên mẫu; expand nghĩa là mở rộng.", "expansion/expansive/expanded sai dạng sau to.", "Công ty đã quyết định mở rộng hoạt động kho hàng để cải thiện tốc độ giao hàng."],
    [113, "The reception area was recently renovated to make it more welcoming for visitors.", "Sau make it more cần tính từ; welcoming nghĩa là tạo cảm giác chào đón.", "welcome/welcomed/welcomes không tự nhiên bằng welcoming trong cấu trúc này.", "Khu vực lễ tân gần đây được cải tạo để thân thiện hơn với khách."],
    [114, "The annual budget meeting has been postponed because the chief financial officer is traveling this week.", "because đi với mệnh đề đầy đủ phía sau để nêu lý do.", "despite cần danh từ/cụm danh từ; instead/otherwise không nêu nguyên nhân.", "Cuộc họp ngân sách hằng năm bị hoãn vì giám đốc tài chính đang đi công tác tuần này."],
    [115, "All conference participants must register online so that they can receive their identification badges.", "so that chỉ mục đích: đăng ký trực tuyến để nhận thẻ nhận diện.", "even though chỉ tương phản, rather than chỉ lựa chọn, in case of đi với danh từ.", "Tất cả người tham dự hội nghị phải đăng ký trực tuyến để có thể nhận thẻ nhận diện."],
    [116, "The restaurant's new ordering system has significantly reduced wait times during lunch hours.", "reduced là động từ nên cần trạng từ significantly bổ nghĩa.", "significant là tính từ, significance là danh từ, signify là động từ.", "Hệ thống đặt món mới của nhà hàng đã giảm đáng kể thời gian chờ trong giờ ăn trưa."],
    [117, "Please read the instructions carefully before assembling the office chair.", "read là động từ nên cần trạng từ carefully.", "care/carefulness là danh từ, careful là tính từ.", "Vui lòng đọc kỹ hướng dẫn trước khi lắp ráp ghế văn phòng."],
    [118, "The company newsletter is sent to employees on the first Monday of each month.", "Dùng on với một ngày cụ thể: on the first Monday.", "at/over/beside không dùng cho ngày cụ thể theo cách này.", "Bản tin công ty được gửi cho nhân viên vào thứ Hai đầu tiên của mỗi tháng."],
    [119, "The laptop warranty covers repairs caused by manufacturing defects.", "caused by là rút gọn của that are caused by, nghĩa là do lỗi sản xuất gây ra.", "causing/cause/causes không tạo cụm bị động đúng sau repairs.", "Bảo hành máy tính xách tay bao gồm sửa chữa do lỗi sản xuất gây ra."],
    [120, "The new branch office is conveniently located near several major transportation routes.", "conveniently located là cụm thường dùng, cần trạng từ bổ nghĩa cho located.", "convenience/convenient/conveniences sai loại từ hoặc không bổ nghĩa đúng cho located.", "Văn phòng chi nhánh mới nằm ở vị trí thuận tiện gần nhiều tuyến giao thông chính."],
    [121, "The supervisor requested that the shipment be inspected before it is sent to the client.", "Sau request that dùng giả định: S + V nguyên mẫu; dạng bị động là be inspected.", "is/was/has không đúng dạng giả định sau requested that.", "Người giám sát yêu cầu lô hàng được kiểm tra trước khi gửi cho khách hàng."],
    [122, "Ms. Lee was promoted because of her commitment to improving customer satisfaction.", "Sau her cần danh từ; commitment to + V-ing là cấu trúc đúng.", "commit/committed/committing sai loại từ sau tính từ sở hữu her.", "Cô Lee được thăng chức nhờ sự tận tâm trong việc cải thiện sự hài lòng của khách hàng."],
    [123, "The hotel offers discounted rates to guests whose reservations are made at least two weeks in advance.", "whose chỉ sở hữu: guests whose reservations nghĩa là khách có đặt phòng của họ.", "who/whom chỉ người, which chỉ vật; không thể hiện sở hữu.", "Khách sạn cung cấp giá giảm cho khách có đặt phòng trước ít nhất hai tuần."],
    [124, "The software engineer found an error in the program and corrected it immediately.", "corrected là động từ nên cần trạng từ immediately.", "immediate/immediacy/more immediate không đúng loại từ sau động từ corrected.", "Kỹ sư phần mềm tìm thấy lỗi trong chương trình và sửa ngay lập tức."],
    [125, "The contract will not become valid until both parties have signed it.", "not ... until nghĩa là không ... cho đến khi.", "whereas/while/besides không tạo nghĩa điều kiện thời gian này.", "Hợp đồng sẽ không có hiệu lực cho đến khi cả hai bên ký."],
    [126, "The board reviewed the proposal prior to making its final decision.", "prior to + V-ing nghĩa là trước khi làm gì.", "except for/due to/according to không diễn tả trình tự trước khi ra quyết định.", "Hội đồng xem xét đề xuất trước khi đưa ra quyết định cuối cùng."],
    [127, "We are looking for a supplier that can deliver replacement parts within twenty-four hours.", "that là đại từ quan hệ thay cho supplier và nối với mệnh đề can deliver.", "whose chỉ sở hữu, who dùng cho người, what không thay cho danh từ trước đó.", "Chúng tôi đang tìm nhà cung cấp có thể giao linh kiện thay thế trong vòng hai mươi bốn giờ."],
    [128, "The company's profits increased steadily during the second quarter.", "increased là động từ nên cần trạng từ steadily.", "steadiness là danh từ, steady là tính từ, steadied là động từ quá khứ.", "Lợi nhuận công ty tăng đều đặn trong quý hai."],
    [129, "Please leave a message with the receptionist if Mr. Howard is unavailable when you call.", "Sau is cần tính từ; unavailable nghĩa là không có mặt/không liên lạc được.", "availability là danh từ, availably là trạng từ; available trái nghĩa với ngữ cảnh để lại lời nhắn.", "Vui lòng để lại lời nhắn với lễ tân nếu ông Howard không có mặt khi bạn gọi."],
    [130, "The operations team is responsible for ensuring that all deliveries arrive ahead of schedule.", "ahead of schedule là cụm cố định nghĩa là sớm hơn kế hoạch.", "along/between/off không tạo cụm đúng với schedule trong nghĩa này.", "Đội vận hành chịu trách nhiệm đảm bảo mọi đơn giao hàng đến sớm hơn kế hoạch."]
  ].forEach(([questionNo, fullQuestion, explain, wrongNote, translate]) => q(questionNo, { fullQuestion, explain, wrongNote, translate }));

  const conciseDetails = {
    131: ["needing là rút gọn của anyone who needs access, chỉ người cần lấy tài liệu.", "need/needs/needed không phù hợp sau anyone trong cụm rút gọn này.", "Nhân viên an ninh sẽ hỗ trợ bất kỳ ai cần lấy tài liệu cần thiết."],
    132: ["Nevertheless nối hai ý tương phản: dự kiến xong đúng lịch nhưng vẫn không nên làm việc ở khu vực đó.", genericWrong, "Tuy nhiên, nhân viên không nên làm việc ở khu vực bị ảnh hưởng vào sáng thứ Bảy."],
    133: ["Câu này phù hợp trước lời cảm ơn và kết thúc thông báo bảo trì.", genericWrong, "Vui lòng liên hệ Văn phòng Cơ sở vật chất nếu bạn có câu hỏi."],
    134: ["Toàn bộ e-mail thông báo thời gian, khu vực hạn chế và hỗ trợ trong đợt bảo trì cuối tuần.", genericWrong, "Mục đích là giải thích lịch bảo trì cuối tuần."],
    135: ["collected là phân từ bị động, rút gọn từ feedback that was collected.", genericWrong, "Sự thay đổi dựa trên phản hồi khách hàng được thu thập trong khảo sát gần đây."],
    136: ["In addition bổ sung thêm thông tin về hỗ trợ đặt lại mật khẩu vào buổi tối.", genericWrong, "Ngoài ra, khách hàng cần đặt lại mật khẩu có thể nói chuyện với nhân viên muộn hơn."],
    137: ["Đây là câu kết lịch sự và tự nhiên trong thông báo gửi khách hàng.", genericWrong, "Chúng tôi trân trọng việc quý khách tiếp tục sử dụng dịch vụ."],
    138: ["Bài nêu nhiều khách hàng cần hỗ trợ ngoài giờ làm việc thông thường.", genericWrong, "Ngân hàng mở rộng giờ vì khách hàng muốn có thêm thời gian hỗ trợ."],
    139: ["process là động từ nên cần trạng từ efficiently.", genericWrong, "Máy phân loại tự động xử lý kiện hàng hiệu quả hơn thiết bị cũ."],
    140: ["Trước location cần tính từ strategic.", genericWrong, "BrightPath chọn Riverton vì vị trí chiến lược gần cao tốc và đường sắt hàng hóa."],
    141: ["Lễ cắt băng khánh thành phù hợp với bài báo về trung tâm mới khai trương.", genericWrong, "Quan chức địa phương đã dự lễ cắt băng khánh thành."],
    142: ["Bài chủ yếu nói BrightPath Logistics mở cơ sở phân phối mới.", genericWrong, "Ý chính là cơ sở mới của một công ty logistics."],
    143: ["additional charge là cụm đúng, nghĩa là phí bổ sung.", genericWrong, "Món tráng miệng có thể thêm với phí bổ sung 4 đô la/người."],
    144: ["Otherwise nghĩa là nếu không thì, nối với hậu quả không kịp điều chỉnh đơn món.", genericWrong, "Nếu không, chúng tôi có thể không điều chỉnh kịp đơn đặt món."],
    145: ["Câu này dẫn tự nhiên tới câu sau: I have attached the detailed estimate.", genericWrong, "Vui lòng xem tệp đính kèm để biết giá chi tiết theo từng mục."],
    146: ["Email nói rõ người gửi đã chuẩn bị bản ước tính chi phí catering.", genericWrong, "Mục đích là cung cấp báo giá dịch vụ ăn uống."],
    147: ["Thông báo tập trung vào việc vệ sinh nhà để xe.", genericWrong, "Thông báo chủ yếu nói về việc vệ sinh nhà để xe."],
    148: ["Bài nêu rõ thời gian là Sunday, February 11.", genericWrong, "Việc vệ sinh diễn ra vào Chủ nhật, ngày 11 tháng 2."],
    149: ["Xe phải được di chuyển khỏi tầng B2 và B3 trước 6:00 A.M.", genericWrong, "Nhân viên phải di chuyển xe khỏi hai tầng trước 6:00 sáng."],
    150: ["Bài cho phép dùng visitor parking area on the first level.", genericWrong, "Nhân viên có thể đỗ ở khu vực đỗ xe dành cho khách."],
    151: ["Lab 2 không khả dụng vì thiết bị kiểm tra mới sẽ được lắp đặt.", genericWrong, "Phòng thí nghiệm 2 không dùng được vì thiết bị mới sẽ được lắp đặt."],
    152: ["Email yêu cầu cập nhật shared calendar trước trưa thứ Hai.", genericWrong, "Các thành viên nên cập nhật lịch chung."],
    153: ["Buổi hướng dẫn được nêu là Wednesday at 10:00 A.M.", genericWrong, "Buổi hướng dẫn diễn ra lúc 10:00 sáng thứ Tư."],
    154: ["Attendance được khuyến khích cho anyone who will use the new machine.", genericWrong, "Bất kỳ ai dùng máy mới nên tham dự."],
    155: ["ClearView cung cấp professional window cleaning.", genericWrong, "ClearView cung cấp dịch vụ vệ sinh cửa sổ."],
    156: ["Bài nói sản phẩm làm sạch thân thiện với môi trường.", genericWrong, "Sản phẩm của ClearView thân thiện với môi trường."],
    157: ["First-time commercial customers được giảm 10%.", genericWrong, "Khách hàng thương mại lần đầu có thể được giảm giá."],
    158: ["Khách có thể hoàn thành form trên web hoặc gọi 555-0137.", genericWrong, "Khách hàng yêu cầu báo giá bằng biểu mẫu online hoặc gọi điện."],
    159: ["Mark nói carrying case was not included.", genericWrong, "Vấn đề là túi đựng bị thiếu."],
    160: ["Lena cần túi vì buổi thuyết trình ở văn phòng khách hàng.", genericWrong, "Cần túi đựng vì buổi thuyết trình tại văn phòng khách hàng."],
    161: ["Nhà cung cấp nói case was shipped separately.", genericWrong, "Túi đựng được gửi riêng."],
    162: ["Lena yêu cầu Mark test the projector khi túi đến.", genericWrong, "Mark sẽ kiểm tra máy chiếu sau khi túi đến."],
    163: ["Bài nói Sweet Corner Bakery introduced an online ordering system.", genericWrong, "Tiệm bánh đã giới thiệu hệ thống đặt hàng trực tuyến."],
    164: ["Hệ thống được tạo vì khách muốn cách đặt đơn lớn nhanh hơn.", genericWrong, "Khách hàng muốn cách đặt hàng nhanh hơn."],
    165: ["Khách có thể choose pickup times qua website.", genericWrong, "Khách hàng có thể chọn thời gian nhận hàng."],
    166: ["Đơn online từ 50 đô la trở lên trong hai tuần đầu nhận hộp bánh quy miễn phí.", genericWrong, "Một số khách hàng sẽ nhận hộp bánh quy miễn phí."],
    167: ["Trong lịch, Managing Remote Teams ở phòng 301.", genericWrong, "Seminar ở phòng 301 là Managing Remote Teams."],
    168: ["Basic Contract Review bắt đầu lúc 10:00 A.M.", genericWrong, "Seminar bắt đầu lúc 10:00 sáng là Basic Contract Review."],
    169: ["Người tham gia phải đăng ký ít nhất ba ngày trước mỗi seminar.", genericWrong, "Phải đăng ký trước ít nhất ba ngày."],
    170: ["Printed materials có tại registration desk.", genericWrong, "Tài liệu in có ở quầy đăng ký."],
    171: ["Memo nói thay đổi nhằm làm hàng khuyến mãi dễ thấy hơn.", genericWrong, "Mục đích là làm sản phẩm khuyến mãi dễ thấy hơn."],
    172: ["Current display phải được gỡ by Sunday evening.", genericWrong, "Khu trưng bày hiện tại nên gỡ trước tối Chủ nhật."],
    173: ["Visual merchandising team sẽ thiết lập spring display.", genericWrong, "Đội trưng bày hình ảnh sẽ thiết lập khu trưng bày mùa xuân."],
    174: ["Winter items còn lại đặt trong clearance section.", genericWrong, "Các mặt hàng mùa đông sẽ ở khu giảm giá."],
    175: ["Email và hóa đơn đều nói mua large conference table.", genericWrong, "Dalton Consulting đã mua bàn họp."],
    176: ["Grace nói bàn đến đúng giờ và excellent condition.", genericWrong, "Chiếc bàn ở trong tình trạng rất tốt."],
    177: ["Grace thắc mắc vì hóa đơn có assembly fee 60 đô la.", genericWrong, "Hóa đơn bị thắc mắc vì có phí lắp ráp."],
    178: ["Ghi chú nêu lắp ráp miễn phí cho đơn nội thất trên 900 đô la; bàn giá 950 đô la.", genericWrong, "Lắp ráp nên miễn phí vì đơn mua trên 900 đô la."],
    179: ["Tổng đúng là 950 + 40 = 990 vì bỏ phí lắp ráp.", genericWrong, "Tổng tiền sửa lại là 990 đô la."],
    180: ["Grace yêu cầu review invoice và gửi corrected version.", genericWrong, "Grace yêu cầu hóa đơn đã sửa."],
    181: ["Khóa Time Management Essentials giúp tổ chức việc và đặt ưu tiên.", genericWrong, "Khóa học giúp sắp xếp công việc và đặt thứ tự ưu tiên."],
    182: ["Effective Business Writing là khóa two-day course.", genericWrong, "Khóa Effective Business Writing kéo dài hai ngày."],
    183: ["Nhóm Samuel cần đàm phán với nhà cung cấp về giá và hợp đồng nên chọn Negotiation Skills for Managers.", genericWrong, "Khóa phù hợp nhất là Negotiation Skills for Managers."],
    184: ["Email nói nhóm gặp suppliers để discuss prices and contract conditions.", genericWrong, "Nhóm gặp nhà cung cấp để thảo luận giá và điều kiện hợp đồng."],
    185: ["Samuel muốn đăng ký six team members.", genericWrong, "Samuel muốn đăng ký sáu nhân viên."],
    186: ["Giảm giá áp dụng từ năm nhân viên trở lên; Samuel đăng ký sáu người.", genericWrong, "Tổ chức của Samuel có khả năng đủ điều kiện giảm giá."],
    187: ["Pass cho phép đi xe buýt không giới hạn trong thành phố trong một tháng.", genericWrong, "Thẻ cho phép đi xe buýt không giới hạn trong thành phố một tháng."],
    188: ["Quảng cáo ghi pass costs $68.", genericWrong, "Một thẻ có giá 68 đô la trước giảm giá."],
    189: ["Nina hỏi tổng chi phí sau giảm giá khi mua cho 12 nhân viên.", genericWrong, "Nina liên hệ để hỏi về mua theo nhóm."],
    190: ["Email nói mua passes for twelve employees.", genericWrong, "Công ty dự định mua mười hai thẻ."],
    191: ["Mua từ ten or more passes được giảm 12%; công ty mua 12.", genericWrong, "Công ty đủ điều kiện vì mua ít nhất mười thẻ."],
    192: ["$68 x 12 = $816; giảm 12% là $97.92; còn $718.08.", genericWrong, "Tổng sau giảm giá là 718,08 đô la."],
    193: ["Mỗi thẻ active the first time it is used.", genericWrong, "Mỗi thẻ kích hoạt vào lần đầu được sử dụng."],
    194: ["Thông báo nói chương trình bắt đầu September 1.", genericWrong, "Chương trình bắt đầu ngày 1 tháng 9."],
    195: ["Fitness classes được tổ chức trong multipurpose room.", genericWrong, "Lớp thể dục diễn ra trong phòng đa năng."],
    196: ["Nhân viên dự ít nhất 8 lớp fitness trong tháng 9 nhận $25 gift card.", genericWrong, "Nhân viên nhận thẻ quà tặng 25 đô la."],
    197: ["Daniel làm ở West Office và không thể đến headquarters trong giờ trưa.", genericWrong, "Daniel liên hệ vì không thể đến trụ sở chính vào giờ ăn trưa."],
    198: ["Maya nói nutrition workshops sẽ được ghi hình và cung cấp online.", genericWrong, "Bản ghi workshop dinh dưỡng sẽ có online."],
    199: ["Maya nói lớp fitness buổi trưa chỉ trực tiếp trong tháng đầu.", genericWrong, "Lớp thể dục chỉ tổ chức trực tiếp trong tháng đầu tiên."],
    200: ["Gift card chỉ tính fitness classes; nutrition workshops không được tính.", genericWrong, "Workshop dinh dưỡng không được tính vào yêu cầu nhận thẻ quà tặng."]
  };
  Object.entries(conciseDetails).forEach(([questionNo, [explain, wrongNote, translate]]) => q(Number(questionNo), { explain, wrongNote, translate }));

  const groupTranslations = {
    "Text 1": "Kính gửi các trưởng phòng,\nKỹ thuật viên bảo trì sẽ kiểm tra và sửa hệ thống điều hòa vào thứ Bảy từ 7:00 sáng đến 1:00 chiều. Trong thời gian này, việc ra vào tầng 4 đến 6 sẽ bị hạn chế.\nNếu nhóm của bạn cần lấy tài liệu từ các tầng đó, hãy thực hiện trước chiều thứ Sáu. Nhân viên an ninh sẽ hỗ trợ người cần lấy tài liệu thiết yếu trong thời gian bảo trì.\nCông việc dự kiến hoàn thành đúng lịch. Tuy nhiên, nhân viên không nên làm việc ở khu vực bị ảnh hưởng vào sáng thứ Bảy.\nVui lòng liên hệ Văn phòng Cơ sở vật chất nếu có câu hỏi. Cảm ơn sự hợp tác của bạn.",
    "Text 2": "Thông báo khách hàng: Mở rộng giờ dịch vụ\nTừ ngày 5 tháng 6, Westlake Bank kéo dài giờ hỗ trợ khách hàng từ 7:00 sáng đến 9:00 tối, thứ Hai đến thứ Sáu.\nThay đổi này dựa trên phản hồi khảo sát gần đây. Nhiều khách hàng cần hỗ trợ ngoài giờ làm việc thường lệ.\nDịch vụ ngân hàng trực tuyến vẫn hoạt động 24/24. Ngoài ra, khách hàng cần đặt lại mật khẩu có thể nói chuyện với nhân viên hỗ trợ muộn hơn vào buổi tối.\nChúng tôi trân trọng sự tin tưởng của quý khách.",
    "Text 3": "Trung tâm phân phối mới mở tại Riverton\nBrightPath Logistics mở trung tâm phân phối mới ở Riverton. Cơ sở này giúp xử lý nhiều đơn hàng hơn và giảm thời gian vận chuyển.\nTrung tâm có máy phân loại tự động xử lý kiện hàng hiệu quả hơn thiết bị cũ và dự kiến tạo khoảng bốn mươi việc làm.\nBrightPath chọn Riverton vì vị trí chiến lược gần cao tốc và tuyến đường sắt hàng hóa.\nQuan chức địa phương dự lễ cắt băng khánh thành. Trung tâm dự kiến hoạt động đầy đủ vào cuối tháng.",
    "Text 4": "Kính gửi cô Nair,\nCảm ơn cô đã cân nhắc Bayview Catering cho bữa trưa vinh danh nhân viên. Tôi đã chuẩn bị ước tính chi phí cho 75 khách vào ngày 18 tháng 8.\nƯớc tính gồm buffet trưa, đồ uống, khăn trải bàn và nhân viên phục vụ. Món tráng miệng có thể thêm với phí bổ sung 4 đô la/người.\nNếu số lượng khách thay đổi, vui lòng báo trước ít nhất năm ngày làm việc. Nếu không, chúng tôi có thể không điều chỉnh kịp đơn món.\nVui lòng xem tệp đính kèm để biết giá chi tiết theo từng mục.",
    "Single Passage 1": "Vệ sinh nhà để xe\nNhà để xe tại Mason Corporate Center sẽ được vệ sinh vào Chủ nhật, ngày 11 tháng 2, từ 6:00 sáng đến 4:00 chiều. Xe phải được di chuyển khỏi tầng B2 và B3 trước 6:00 sáng.\nNhân viên cần đỗ xe tại chỗ có thể dùng khu vực đỗ xe dành cho khách ở tầng một. Việc đỗ xe bình thường tiếp tục vào sáng thứ Hai.",
    "Single Passage 2": "Gửi nhóm nghiên cứu,\nVì thiết bị kiểm tra mới sẽ được lắp vào sáng thứ Ba, Phòng thí nghiệm 2 sẽ không khả dụng đến 1:00 chiều. Thí nghiệm sáng thứ Ba nên chuyển sang Lab 1 hoặc hoãn lại.\nVui lòng cập nhật lịch chung trước trưa thứ Hai. Nhà cung cấp thiết bị sẽ hướng dẫn ngắn vào thứ Tư lúc 10:00 sáng. Ai dùng máy mới đều nên tham dự.",
    "Single Passage 3": "ClearView cung cấp dịch vụ vệ sinh cửa sổ chuyên nghiệp cho văn phòng, nhà hàng và cửa hàng bán lẻ. Nhân viên dùng sản phẩm thân thiện với môi trường và lịch linh hoạt để giảm gián đoạn.\nKhách hàng thương mại lần đầu được giảm 10% nếu đặt trước ngày 31 tháng 5. Có thể yêu cầu báo giá miễn phí qua biểu mẫu web hoặc điện thoại.",
    "Single Passage 4": "Lena hỏi Mark máy chiếu cho buổi thuyết trình ngày mai đã đến chưa. Mark nói máy đã đến nhưng thiếu túi đựng. Lena cần túi vì thuyết trình tại văn phòng khách hàng. Nhà cung cấp nói túi được gửi riêng và sẽ đến trước 3:00 chiều. Lena yêu cầu Mark kiểm tra máy chiếu khi túi đến.",
    "Single Passage 5": "Sweet Corner Bakery giới thiệu hệ thống đặt hàng trực tuyến cho bánh kem, bánh ngọt và khay tiệc. Khách có thể chọn sản phẩm, thời gian nhận và thanh toán qua website.\nHệ thống được tạo vì khách muốn đặt đơn lớn nhanh hơn. Trong hai tuần đầu, đơn online từ 50 đô la trở lên nhận một hộp bánh quy miễn phí.",
    "Single Passage 6": "Riverside Business Center có lịch seminar tháng 3 gồm Social Media for Small Businesses, Managing Remote Teams, Basic Contract Review và Building Customer Loyalty. Người tham gia phải đăng ký ít nhất ba ngày trước mỗi seminar. Tài liệu in có ở quầy đăng ký.",
    "Single Passage 7": "Gửi toàn bộ nhân viên cửa hàng,\nTừ thứ Hai tới, sản phẩm theo mùa sẽ được trưng bày gần lối vào để hàng khuyến mãi dễ thấy hơn. Hãy gỡ khu hiện tại trước tối Chủ nhật và đặt hàng mùa đông còn lại vào khu giảm giá. Đội trưng bày sẽ thiết lập khu mùa xuân vào sáng thứ Hai.",
    "Double Passage 1": "Grace Miller nhận hóa đơn cho bàn họp lớn đã giao. Bàn đến đúng giờ và tình trạng rất tốt, nhưng hóa đơn có phí lắp ráp 60 đô la. Grace được thông báo lắp ráp miễn phí vì bàn trên 900 đô la nên yêu cầu xem lại và gửi hóa đơn sửa.\nHóa đơn ghi bàn 950 đô la, giao hàng 40 đô la, lắp ráp 60 đô la, tổng 1.050 đô la. Ghi chú: lắp ráp miễn phí cho đơn nội thất trên 900 đô la.",
    "Double Passage 2": "Oakridge Training Institute có các khóa Time Management Essentials, Effective Business Writing và Negotiation Skills for Managers. Giảm giá nhóm áp dụng cho tổ chức đăng ký từ năm nhân viên trở lên cùng khóa.\nSamuel quản lý nhóm mua hàng thường gặp nhà cung cấp để bàn giá và điều kiện hợp đồng. Anh muốn đăng ký sáu người và hỏi khóa phù hợp cùng điều kiện giảm giá.",
    "Triple Passage 1": "GreenLine Commuter Pass cho phép đi xe buýt không giới hạn trong thành phố trong một tháng, giá 68 đô la. Nhà tuyển dụng mua từ mười thẻ trở lên được giảm 12%; thẻ kích hoạt ngày đầu sử dụng.\nNina hỏi chi phí cho 12 thẻ và các thẻ có cần bắt đầu cùng ngày không. GreenLine xác nhận tổng sau giảm giá là 718,08 đô la và mỗi thẻ kích hoạt khi dùng lần đầu.",
    "Triple Passage 2": "Carter & Lowe bắt đầu chương trình chăm sóc sức khỏe ngày 1 tháng 9. Nhân viên có thể dự lớp thể dục miễn phí vào trưa thứ Ba và thứ Năm trong phòng đa năng, cùng workshop dinh dưỡng hằng tháng. Dự ít nhất tám lớp thể dục trong tháng 9 sẽ nhận thẻ quà tặng 25 đô la.\nDaniel hỏi có lựa chọn online không vì làm ở văn phòng phía Tây. Maya trả lời workshop dinh dưỡng sẽ có bản ghi online, nhưng lớp thể dục chỉ trực tiếp trong tháng đầu. Workshop dinh dưỡng không tính vào yêu cầu nhận thẻ."
  };
  questions.forEach((item) => {
    if (item.group && groupTranslations[item.group]) item.groupTranslation = groupTranslations[item.group];
  });

  window.TOEIC_READING_EXAMS.y2018 = {
    meta: {
        "id": "y2018",
        "label": "TOEIC Reading 2018",
        "company": "Mason Corporate Center",
        "place": "Riverton",
        "event": "workplace services and training",
        "product": "commuter pass",
        "department": "facilities",
        "service": "customer support",
        "theme": "2018-style workplace, service, logistics, and training contexts"
    },
    questions
  };
})();
