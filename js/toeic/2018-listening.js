// TOEIC Listening 2018 data.
window.TOEIC_LISTENING_EXAMS = window.TOEIC_LISTENING_EXAMS || {};

(() => {
  const questions = [];
  const labels = ["A", "B", "C", "D"];
  const audioVersion = "english-v2";

  function formatTranscript(question, options) {
    return [
      question ? `Question: ${question}` : "",
      ...options.map((option, index) => `(${labels[index]}) ${option}`)
    ].filter(Boolean).join("\n");
  }

  function getDefaultAudioUrl(partNumber, questionNo, group) {
    if (partNumber === 1 || partNumber === 2) {
      return `audio/toeic/2018/part${partNumber}/question-${String(questionNo).padStart(3, "0")}.mp3?v=${audioVersion}`;
    }

    const range = String(group || "").match(/(\d+)-(\d+)/);
    if (range) {
      return `audio/toeic/2018/part${partNumber}/questions-${String(range[1]).padStart(3, "0")}-${String(range[2]).padStart(3, "0")}.mp3?v=${audioVersion}`;
    }

    return `audio/toeic/2018/part${partNumber}/question-${String(questionNo).padStart(3, "0")}.mp3?v=${audioVersion}`;
  }

  function add(partNumber, questionNo, question, options, answerIndex, extras = {}) {
    const answer = options[answerIndex];
    questions.push({
      partNumber,
      questionNo,
      question,
      options,
      answer,
      audioUrl: extras.audioUrl || getDefaultAudioUrl(partNumber, questionNo, extras.group),
      transcript: extras.transcript || formatTranscript(question, options),
      explain: extras.explain || `The correct answer is "${answer}".`,
      ...(extras.imageUrl ? { imageUrl: extras.imageUrl } : {}),
      ...(extras.group ? { group: extras.group } : {}),
      ...(extras.passage ? { passage: extras.passage } : {}),
      ...(extras.topic ? { topic: extras.topic } : {}),
      ...(extras.trapType ? { trapType: extras.trapType } : {}),
      ...(extras.skill ? { skill: extras.skill } : {}),
      ...(extras.talkType ? { talkType: extras.talkType } : {})
    });
  }

  function addSet(partNumber, group, passage, items, extras = {}) {
    items.forEach((item) => {
      add(partNumber, item.no, item.question, item.options, item.answerIndex, {
        group,
        passage,
        topic: extras.topic,
        skill: item.skill || extras.skill,
        talkType: extras.talkType,
        explain: item.explain,
        transcript: passage
      });
    });
  }

  add(1, 1, "Which statement best describes the picture?", [
    "A woman is closing a laptop.",
    "Some people are looking at a computer screen.",
    "A man is hanging a picture on a wall.",
    "Several documents are being placed in a drawer."
  ], 1, {
    imageUrl: "images/toeic/2018/part1/question-001.png",
    topic: "Two office workers looking at a laptop in a meeting room",
    skill: "photo description",
    explain: "The picture shows people looking at a computer screen."
  });

  add(1, 2, "Which statement best describes the picture?", [
    "A man is carrying a ladder across a room.",
    "Some boxes are being loaded onto a truck.",
    "A worker is stacking boxes on a shelf.",
    "A machine is cleaning the floor."
  ], 2, {
    imageUrl: "images/toeic/2018/part1/question-002.png",
    topic: "A man stacking boxes in a warehouse",
    skill: "photo description",
    explain: "The picture shows a worker stacking boxes on a shelf."
  });

  add(1, 3, "Which statement best describes the picture?", [
    "A woman is watering some plants.",
    "A woman is sweeping a sidewalk.",
    "A tree is being cut down.",
    "Some flowers are being arranged in a vase."
  ], 0, {
    imageUrl: "images/toeic/2018/part1/question-003.png",
    topic: "A woman watering plants outside a building",
    skill: "photo description",
    explain: "The picture shows a woman watering plants."
  });

  add(1, 4, "Which statement best describes the picture?", [
    "A bus driver is checking a ticket.",
    "Some passengers are waiting outdoors.",
    "A road is being repaired.",
    "People are boarding an airplane."
  ], 1, {
    imageUrl: "images/toeic/2018/part1/question-004.png",
    topic: "Passengers waiting near a bus stop",
    skill: "photo description",
    explain: "The picture shows passengers waiting outdoors."
  });

  add(1, 5, "Which statement best describes the picture?", [
    "A man is serving food to customers.",
    "A chef is cutting some vegetables.",
    "A table is being cleaned.",
    "Some dishes are being stacked on a shelf."
  ], 1, {
    imageUrl: "images/toeic/2018/part1/question-005.png",
    topic: "A chef chopping vegetables in a kitchen",
    skill: "photo description",
    explain: "The picture shows a chef cutting vegetables."
  });

  add(1, 6, "Which statement best describes the picture?", [
    "A customer is looking at some clothing.",
    "A cashier is counting money.",
    "Some clothes are being packed into a box.",
    "A woman is opening a store entrance."
  ], 0, {
    imageUrl: "images/toeic/2018/part1/question-006.png",
    topic: "A woman standing beside a display of clothes in a store",
    skill: "photo description",
    explain: "The picture shows a customer looking at clothing."
  });

  add(2, 7, "When will the new printer be installed?", [
    "In the copy room.",
    "Tomorrow morning.",
    "By a technician."
  ], 1, { skill: "time response" });

  add(2, 8, "Who is leading the training session?", [
    "Ms. Wilson is.",
    "It starts at ten.",
    "In the main conference room."
  ], 0, { skill: "person response" });

  add(2, 9, "Could you review this report before lunch?", [
    "Sure, I'll look at it now.",
    "Yes, lunch was excellent.",
    "It was printed in color."
  ], 0, { skill: "request response" });

  add(2, 10, "Where should visitors park?", [
    "They visited yesterday.",
    "In the lot behind the building.",
    "The park is very large."
  ], 1, { skill: "place response" });

  add(2, 11, "Why was the client meeting canceled?", [
    "Because the client's flight was delayed.",
    "At three o'clock.",
    "In Room 405."
  ], 0, { skill: "reason response" });

  add(2, 12, "Has the maintenance team fixed the elevator?", [
    "Yes, it's working again.",
    "The team meets weekly.",
    "On the fifth floor."
  ], 0, { skill: "yes-no response" });

  add(2, 13, "Would you like me to make a reservation?", [
    "No, I already reserved one.",
    "That would be very helpful.",
    "The restaurant serves seafood."
  ], 1, { skill: "offer response" });

  add(2, 14, "How long does the factory tour take?", [
    "About one hour.",
    "At the main entrance.",
    "The factory is new."
  ], 0, { skill: "duration response" });

  add(2, 15, "I can't find the updated schedule.", [
    "I'll send you another copy.",
    "It was scheduled for Monday.",
    "The update took an hour."
  ], 0, { skill: "problem response" });

  add(2, 16, "Did you order more coffee for the break room?", [
    "Yes, it should arrive this afternoon.",
    "The room is next to the kitchen.",
    "I prefer tea."
  ], 0, { skill: "yes-no response" });

  add(2, 17, "Which presentation should we attend?", [
    "The one about digital marketing.",
    "It will be presented tomorrow.",
    "The projector is ready."
  ], 0, { skill: "choice response" });

  add(2, 18, "The shipment hasn't arrived yet.", [
    "I'll call the delivery company.",
    "It arrived by train.",
    "The ship is at the dock."
  ], 0, { skill: "problem response" });

  add(2, 19, "Why don't we ask the manager for approval?", [
    "Good idea. I'll call her.",
    "She approved it yesterday.",
    "The manager's office is large."
  ], 0, { skill: "suggestion response" });

  add(2, 20, "Is there enough seating for everyone?", [
    "Yes, we added more chairs.",
    "Everyone is seated quietly.",
    "The seat is near the window."
  ], 0, { skill: "yes-no response" });

  add(2, 21, "Where can I get a visitor badge?", [
    "At the reception desk.",
    "Yes, visitors need one.",
    "It has your name on it."
  ], 0, { skill: "place response" });

  add(2, 22, "Should I forward this message to the sales team?", [
    "Yes, please send it to them.",
    "The sales team won an award.",
    "I received a message yesterday."
  ], 0, { skill: "yes-no response" });

  add(2, 23, "When does the store inventory begin?", [
    "After closing tonight.",
    "In the storage room.",
    "The store sells furniture."
  ], 0, { skill: "time response" });

  add(2, 24, "Who repaired the air conditioner?", [
    "A technician from Blake Services.",
    "It was very cold yesterday.",
    "In the storage area."
  ], 0, { skill: "person response" });

  add(2, 25, "The conference room projector isn't working.", [
    "I'll contact technical support.",
    "The conference was interesting.",
    "It projects sales growth."
  ], 0, { skill: "problem response" });

  add(2, 26, "Have you submitted the expense form?", [
    "Not yet. I'm waiting for a receipt.",
    "The form is on the desk.",
    "Expenses increased last month."
  ], 0, { skill: "yes-no response" });

  add(2, 27, "What time does the workshop end?", [
    "Around four thirty.",
    "At the workshop table.",
    "It ended successfully."
  ], 0, { skill: "time response" });

  add(2, 28, "Could you pick up the brochures from the printer?", [
    "Sure, I'll go this afternoon.",
    "They printed the brochures.",
    "The printer is out of paper."
  ], 0, { skill: "request response" });

  add(2, 29, "Why is the front entrance closed?", [
    "It's being cleaned.",
    "At the front desk.",
    "The entrance fee is ten dollars."
  ], 0, { skill: "reason response" });

  add(2, 30, "Do you prefer the blue design or the green one?", [
    "The green one looks more professional.",
    "Yes, I designed it yesterday.",
    "It's in the design department."
  ], 0, { skill: "choice response" });

  add(2, 31, "How many people registered for the seminar?", [
    "Nearly eighty.",
    "By e-mail.",
    "In the seminar room."
  ], 0, { skill: "quantity response" });

  addSet(3, "Questions 32-34", `W: Hi, I'm calling about the office desks we ordered last week.
M: Yes, they were shipped yesterday morning.
W: Great. Do you know when they'll arrive?
M: The delivery company said they should be there by Friday afternoon.`, [
    {
      no: 32,
      question: "What did the woman order?",
      options: ["Office desks", "Desk lamps", "Filing cabinets", "Computer monitors"],
      answerIndex: 0
    },
    {
      no: 33,
      question: "When were the items shipped?",
      options: ["Last Friday", "Yesterday morning", "This afternoon", "Next week"],
      answerIndex: 1
    },
    {
      no: 34,
      question: "When should the delivery arrive?",
      options: ["Tonight", "Friday afternoon", "Monday morning", "Next month"],
      answerIndex: 1
    }
  ], { topic: "office furniture delivery", skill: "conversation details" });

  addSet(3, "Questions 35-37", `M: I'm here for the ten o'clock interview with Ms. Chen.
W: She's running a few minutes late. Would you like to wait in the seating area?
M: Sure. Should I fill out any forms?
W: Yes, please complete this application form before she comes out.`, [
    {
      no: 35,
      question: "Where most likely are the speakers?",
      options: ["At a restaurant", "At a hospital", "At an office reception area", "At a train station"],
      answerIndex: 2
    },
    {
      no: 36,
      question: "Why is Ms. Chen unavailable?",
      options: ["She is delayed.", "She is on vacation.", "She is interviewing another person.", "She is attending a conference."],
      answerIndex: 0
    },
    {
      no: 37,
      question: "What does the woman ask the man to do?",
      options: ["Call Ms. Chen", "Complete a form", "Wait outside", "Return tomorrow"],
      answerIndex: 1
    }
  ], { topic: "job interview reception", skill: "conversation inference" });

  addSet(3, "Questions 38-40", `W: Have you seen the new menu for the cafe downstairs?
M: Yes. They added several vegetarian options.
W: That's good. I'm planning to take the visiting clients there for lunch.
M: You should make a reservation. It gets crowded around noon.`, [
    {
      no: 38,
      question: "What are the speakers discussing?",
      options: ["A cafe menu", "A client contract", "A cooking class", "A marketing plan"],
      answerIndex: 0
    },
    {
      no: 39,
      question: "What was added to the menu?",
      options: ["Breakfast items", "Vegetarian dishes", "Discount meals", "Fresh coffee"],
      answerIndex: 1
    },
    {
      no: 40,
      question: "What does the man suggest?",
      options: ["Ordering takeout", "Making a reservation", "Meeting in the lobby", "Changing the lunch date"],
      answerIndex: 1
    }
  ], { topic: "client lunch plans", skill: "conversation details" });

  addSet(3, "Questions 41-43", `M: The sales figures for April look better than expected.
W: That's great news. Did the new online advertising campaign help?
M: It seems so. Website traffic increased by twenty percent.
W: Then we should continue the campaign for another month.`, [
    {
      no: 41,
      question: "What are the speakers talking about?",
      options: ["Sales results", "A hiring decision", "A store renovation", "Customer complaints"],
      answerIndex: 0
    },
    {
      no: 42,
      question: "What increased by twenty percent?",
      options: ["Product prices", "Website traffic", "Office rent", "Staff overtime"],
      answerIndex: 1
    },
    {
      no: 43,
      question: "What does the woman recommend?",
      options: ["Ending the campaign", "Continuing the campaign", "Hiring more salespeople", "Reducing online orders"],
      answerIndex: 1
    }
  ], { topic: "advertising campaign results", skill: "conversation details" });

  addSet(3, "Questions 44-46", `W: I'm having trouble connecting to the wireless network.
M: Did you try restarting your computer?
W: Yes, but it still won't connect.
M: I'll ask someone from IT to come by your desk.`, [
    {
      no: 44,
      question: "What problem does the woman have?",
      options: ["She cannot connect to the network.", "She lost her computer.", "She needs a new desk.", "She forgot her password."],
      answerIndex: 0
    },
    {
      no: 45,
      question: "What did the woman already do?",
      options: ["Contacted a client", "Restarted her computer", "Replaced a cable", "Sent an e-mail"],
      answerIndex: 1
    },
    {
      no: 46,
      question: "What will the man do?",
      options: ["Move her desk", "Call the building manager", "Ask IT for assistance", "Install a new printer"],
      answerIndex: 2
    }
  ], { topic: "wireless network problem", skill: "conversation details" });

  addSet(3, "Questions 47-49", `M: I noticed the conference registration fee went up.
W: Yes, the early registration period ended yesterday.
M: That's unfortunate. I should have signed up last week.
W: You can still register today, but the price is fifty dollars higher.`, [
    {
      no: 47,
      question: "What are the speakers discussing?",
      options: ["A conference registration fee", "A hotel room charge", "A parking ticket", "A training manual"],
      answerIndex: 0
    },
    {
      no: 48,
      question: "What happened yesterday?",
      options: ["The conference was canceled.", "Early registration ended.", "The speaker arrived.", "The hotel opened."],
      answerIndex: 1
    },
    {
      no: 49,
      question: "What does the woman say?",
      options: ["Registration is still possible.", "The man cannot attend.", "The price has been reduced.", "The event has moved online."],
      answerIndex: 0
    }
  ], { topic: "conference registration", skill: "conversation details" });

  addSet(3, "Questions 50-52", `W: The package from Kingston Electronics arrived this morning.
M: Excellent. Did they send all twenty tablets?
W: Actually, only eighteen were in the box.
M: I'll contact the supplier right away and ask them to send the missing items.`, [
    {
      no: 50,
      question: "What company sent the package?",
      options: ["Kingston Electronics", "Central Shipping", "Parkside Office Supply", "Mason Computers"],
      answerIndex: 0
    },
    {
      no: 51,
      question: "What is the problem?",
      options: ["The package is damaged.", "Some items are missing.", "The tablets do not work.", "The wrong product was sent."],
      answerIndex: 1
    },
    {
      no: 52,
      question: "What will the man do?",
      options: ["Return all the tablets", "Contact the supplier", "Cancel the order", "Visit the warehouse"],
      answerIndex: 1
    }
  ], { topic: "missing tablet shipment", skill: "conversation details" });

  addSet(3, "Questions 53-55", `M: We need to choose someone to give the opening speech at the awards dinner.
W: What about Mr. Blake? He spoke at last year's event, and everyone liked him.
M: He would be good, but he'll be traveling that week.
W: Then maybe Ms. Ortiz can do it. She's comfortable speaking in front of large groups.`, [
    {
      no: 53,
      question: "What are the speakers planning?",
      options: ["An awards dinner", "A business trip", "A training workshop", "A sales campaign"],
      answerIndex: 0
    },
    {
      no: 54,
      question: "Why is Mr. Blake unavailable?",
      options: ["He is retiring.", "He will be traveling.", "He is leading another event.", "He declined the invitation."],
      answerIndex: 1
    },
    {
      no: 55,
      question: "What is said about Ms. Ortiz?",
      options: ["She works in accounting.", "She organized last year's event.", "She speaks well in public.", "She will prepare the food."],
      answerIndex: 2
    }
  ], { topic: "awards dinner speaker", skill: "conversation details" });

  addSet(3, "Questions 56-58", `W: I'm calling about the apartment listed on your website. Is it still available?
M: Yes, it is. Would you like to schedule a viewing?
W: I'd like to see it tomorrow afternoon, if possible.
M: We have an opening at three thirty. Does that work for you?`, [
    {
      no: 56,
      question: "What is the woman interested in?",
      options: ["Renting an apartment", "Buying office furniture", "Reserving a hotel room", "Scheduling a repair"],
      answerIndex: 0
    },
    {
      no: 57,
      question: "What does the man offer to do?",
      options: ["Lower the rent", "Schedule a viewing", "Send a contract", "Clean the apartment"],
      answerIndex: 1
    },
    {
      no: 58,
      question: "When may the woman see the apartment?",
      options: ["This morning", "Tomorrow afternoon", "Next Monday", "At noon today"],
      answerIndex: 1
    }
  ], { topic: "apartment viewing", skill: "conversation details" });

  addSet(3, "Questions 59-61", `M: I heard the company newsletter will be published later than usual this month.
W: That's right. The design team needs more time to finish the layout.
M: Will it still include the article about the charity event?
W: Yes, that article is already finished. Only the design work is delayed.`, [
    {
      no: 59,
      question: "What is delayed?",
      options: ["A company newsletter", "A charity event", "A design workshop", "An employee survey"],
      answerIndex: 0
    },
    {
      no: 60,
      question: "Why is there a delay?",
      options: ["Some interviews were canceled.", "The layout is not finished.", "The printer is broken.", "The article was rejected."],
      answerIndex: 1
    },
    {
      no: 61,
      question: "What is said about the charity event article?",
      options: ["It has been completed.", "It needs more photos.", "It will be removed.", "It was published last week."],
      answerIndex: 0
    }
  ], { topic: "company newsletter delay", skill: "conversation details" });

  addSet(3, "Questions 62-64", `W: The lobby renovation is almost finished.
M: That's good. When will the new furniture arrive?
W: The sofas and chairs are scheduled for delivery on Thursday.
M: Perfect. We can reopen the lobby to visitors next Monday.`, [
    {
      no: 62,
      question: "What area is being renovated?",
      options: ["The cafeteria", "The lobby", "The parking garage", "The conference center"],
      answerIndex: 1
    },
    {
      no: 63,
      question: "What will arrive on Thursday?",
      options: ["New furniture", "Cleaning equipment", "Office computers", "Visitor badges"],
      answerIndex: 0
    },
    {
      no: 64,
      question: "What will happen next Monday?",
      options: ["Visitors can use the lobby again.", "Construction will begin.", "A delivery will be canceled.", "Employees will move offices."],
      answerIndex: 0
    }
  ], { topic: "lobby renovation", skill: "conversation details" });

  addSet(3, "Questions 65-67", `M: I need to change my flight to Denver.
W: What day would you like to travel instead?
M: Thursday morning, if there are any seats available.
W: There's a flight at 8:20 A.M., but there is a change fee.`, [
    {
      no: 65,
      question: "Where most likely does the conversation take place?",
      options: ["At a travel agency", "At a bookstore", "At a restaurant", "At a repair shop"],
      answerIndex: 0
    },
    {
      no: 66,
      question: "What does the man want to do?",
      options: ["Cancel a hotel reservation", "Change a flight", "Rent a car", "Buy luggage"],
      answerIndex: 1
    },
    {
      no: 67,
      question: "What does the woman mention?",
      options: ["A change fee", "A delayed flight", "A missing passport", "A hotel discount"],
      answerIndex: 0
    }
  ], { topic: "flight change", skill: "conversation inference" });

  addSet(3, "Questions 68-70", `W: Did you finish setting up the display for the trade show?
M: Almost. I still need to attach the company banner.
W: The doors open to visitors in thirty minutes.
M: Don't worry. I'll have everything ready before then.`, [
    {
      no: 68,
      question: "What are the speakers preparing for?",
      options: ["A trade show", "A staff meeting", "A restaurant opening", "A delivery inspection"],
      answerIndex: 0
    },
    {
      no: 69,
      question: "What does the man still need to do?",
      options: ["Print tickets", "Attach a banner", "Call visitors", "Arrange chairs"],
      answerIndex: 1
    },
    {
      no: 70,
      question: "When will visitors enter?",
      options: ["In thirty minutes", "Tomorrow morning", "At noon", "Next week"],
      answerIndex: 0
    }
  ], { topic: "trade show setup", skill: "conversation details" });

  addSet(4, "Questions 71-73", `Good afternoon. This is an announcement for all employees in the marketing department. Tomorrow's planning meeting has been moved from Conference Room A to Conference Room C because audio equipment is being installed in Room A. The meeting will still begin at 2 P.M. Please bring a copy of the quarterly advertising report.`, [
    {
      no: 71,
      question: "Who is the announcement for?",
      options: ["Marketing employees", "Building visitors", "New customers", "Maintenance workers"],
      answerIndex: 0
    },
    {
      no: 72,
      question: "Why has the meeting location changed?",
      options: ["A room is being painted.", "Equipment is being installed.", "More people are attending.", "The original room is too small."],
      answerIndex: 1
    },
    {
      no: 73,
      question: "What should employees bring?",
      options: ["Identification cards", "A copy of a report", "Laptop chargers", "Meeting tickets"],
      answerIndex: 1
    }
  ], { topic: "marketing meeting room change", talkType: "announcement", skill: "talk details" });

  addSet(4, "Questions 74-76", `Hello, Mr. Harris. This is Linda from Greenway Auto Service. I'm calling to let you know that your car is ready for pickup. We replaced the front brake pads and changed the oil as requested. Our service department closes at 6 P.M. today, but we will reopen tomorrow morning at 8. Please bring your service receipt when you come in.`, [
    {
      no: 74,
      question: "Why is the speaker calling?",
      options: ["To confirm a car rental", "To say a car is ready", "To schedule an inspection", "To report a lost receipt"],
      answerIndex: 1
    },
    {
      no: 75,
      question: "What service was performed?",
      options: ["A tire replacement", "A brake pad replacement", "A windshield repair", "A battery installation"],
      answerIndex: 1
    },
    {
      no: 76,
      question: "What should Mr. Harris bring?",
      options: ["A service receipt", "A driver's license", "An insurance form", "A parking ticket"],
      answerIndex: 0
    }
  ], { topic: "auto service message", talkType: "telephone message", skill: "talk details" });

  addSet(4, "Questions 77-79", `Are you looking for a reliable way to manage your company's appointments? SchedulePro is a new online scheduling tool designed for small businesses. It allows customers to book appointments online, receive automatic reminders, and change appointment times easily. Sign up for a free thirty-day trial at schedulepro.com and see how much time your business can save.`, [
    {
      no: 77,
      question: "What is being advertised?",
      options: ["A scheduling tool", "A delivery service", "A training course", "A phone plan"],
      answerIndex: 0
    },
    {
      no: 78,
      question: "What can customers do with the product?",
      options: ["Print business cards", "Book appointments online", "Repair computers", "Compare insurance rates"],
      answerIndex: 1
    },
    {
      no: 79,
      question: "What is offered?",
      options: ["Free installation for one year", "A free thirty-day trial", "Discounted office furniture", "Same-day delivery"],
      answerIndex: 1
    }
  ], { topic: "online scheduling tool", talkType: "advertisement", skill: "talk details" });

  addSet(4, "Questions 80-82", `Attention, passengers. The 5:45 train to Brookfield will depart from Platform 6 instead of Platform 4. This change is due to track maintenance near the east end of the station. Passengers should proceed to Platform 6 now. Station staff will be available to assist anyone who needs directions.`, [
    {
      no: 80,
      question: "What is the announcement about?",
      options: ["A platform change", "A canceled train", "A ticket refund", "A lost item"],
      answerIndex: 0
    },
    {
      no: 81,
      question: "Why was the change made?",
      options: ["The train is full.", "Track maintenance is taking place.", "The weather is severe.", "The station is closing."],
      answerIndex: 1
    },
    {
      no: 82,
      question: "What are passengers told to do?",
      options: ["Wait at Platform 4", "Buy new tickets", "Go to Platform 6", "Contact customer service tomorrow"],
      answerIndex: 2
    }
  ], { topic: "train platform change", talkType: "announcement", skill: "talk details" });

  addSet(4, "Questions 83-85", `Thank you for calling Bright Smile Dental Care. Our office hours are Monday through Friday from 8 A.M. to 5 P.M. We are currently closed for the weekend. To schedule an appointment, please leave your name and phone number after the tone. If you are experiencing a dental emergency, please call our emergency number at 555-0147.`, [
    {
      no: 83,
      question: "What kind of business is this?",
      options: ["A dental office", "A travel agency", "A fitness center", "A law firm"],
      answerIndex: 0
    },
    {
      no: 84,
      question: "When is the office open?",
      options: ["On weekends only", "Monday through Friday", "Every evening", "Twenty-four hours a day"],
      answerIndex: 1
    },
    {
      no: 85,
      question: "What should callers do for an emergency?",
      options: ["Leave a message after the tone", "Visit the office immediately", "Call a different number", "Send an e-mail"],
      answerIndex: 2
    }
  ], { topic: "dental office recorded message", talkType: "recorded message", skill: "talk details" });

  addSet(4, "Questions 86-88", `A new public library will open downtown next month. The facility includes study rooms, computer stations, and a children's reading area. According to city officials, the library was built to meet growing demand from residents in the downtown area. A grand opening ceremony will be held on June 5, and the public is invited to attend.`, [
    {
      no: 86,
      question: "What will open next month?",
      options: ["A public library", "A shopping mall", "A community hospital", "A train station"],
      answerIndex: 0
    },
    {
      no: 87,
      question: "Why was the facility built?",
      options: ["To replace a school", "To meet local demand", "To attract tourists", "To reduce traffic"],
      answerIndex: 1
    },
    {
      no: 88,
      question: "What will happen on June 5?",
      options: ["A ceremony will be held.", "A reading contest will end.", "Computer stations will close.", "Officials will inspect the building."],
      answerIndex: 0
    }
  ], { topic: "new public library", talkType: "news report", skill: "talk details" });

  addSet(4, "Questions 89-91", `Welcome to the employee orientation program. During today's session, you will learn about company policies, workplace safety procedures, and employee benefits. After the morning presentation, we will take a short break, followed by a tour of the building. Please keep your information packet with you, as it includes the schedule for the day.`, [
    {
      no: 89,
      question: "Who is the talk most likely for?",
      options: ["New employees", "Existing customers", "Tourists", "Building contractors"],
      answerIndex: 0
    },
    {
      no: 90,
      question: "What will happen after the morning presentation?",
      options: ["A short break", "A job interview", "A lunch delivery", "A performance review"],
      answerIndex: 0
    },
    {
      no: 91,
      question: "What are listeners told to keep?",
      options: ["Their parking receipts", "Their information packets", "Their name badges", "Their travel tickets"],
      answerIndex: 1
    }
  ], { topic: "employee orientation", talkType: "talk", skill: "talk details" });

  addSet(4, "Questions 92-94", `Good evening. We regret to inform you that tonight's outdoor concert has been postponed because of heavy rain. Tickets for tonight's performance will be honored at the rescheduled concert next Friday. If you are unable to attend the new date, please visit the box office before the end of the week to request a refund.`, [
    {
      no: 92,
      question: "Why was the concert postponed?",
      options: ["Because of heavy rain", "Because of low ticket sales", "Because the singer is sick", "Because the stage is unavailable"],
      answerIndex: 0
    },
    {
      no: 93,
      question: "When will the concert be held?",
      options: ["Tomorrow morning", "Next Friday", "At the end of the month", "Tonight at a different location"],
      answerIndex: 1
    },
    {
      no: 94,
      question: "What can people do at the box office?",
      options: ["Buy food vouchers", "Request a refund", "Meet the performers", "Pick up parking passes"],
      answerIndex: 1
    }
  ], { topic: "postponed outdoor concert", talkType: "announcement", skill: "talk details" });

  addSet(4, "Questions 95-97", `Before we discuss next month's budget, I'd like to review the results of our customer satisfaction survey. Overall ratings improved from last year, especially in delivery speed and product quality. However, several customers mentioned that our website is difficult to navigate. For this reason, we will ask the design team to update the website layout.`, [
    {
      no: 95,
      question: "What is being reviewed?",
      options: ["Survey results", "A budget proposal", "Delivery invoices", "Product instructions"],
      answerIndex: 0
    },
    {
      no: 96,
      question: "What improved?",
      options: ["Delivery speed and product quality", "Employee attendance", "Website navigation", "Store decoration"],
      answerIndex: 0
    },
    {
      no: 97,
      question: "What will the design team do?",
      options: ["Update the website layout", "Prepare a budget report", "Call customers directly", "Review delivery schedules"],
      answerIndex: 0
    }
  ], { topic: "customer satisfaction survey", talkType: "meeting excerpt", skill: "talk details" });

  addSet(4, "Questions 98-100", `Attention, shoppers. Starting today, all kitchen appliances on the third floor are on sale for twenty-five percent off the regular price. This promotion includes coffee makers, blenders, and microwave ovens. The sale will continue through Sunday. Please ask a sales associate if you need assistance carrying large items to your vehicle.`, [
    {
      no: 98,
      question: "Where is this announcement probably being made?",
      options: ["In a department store", "At an airport", "In a bank", "At a medical clinic"],
      answerIndex: 0
    },
    {
      no: 99,
      question: "What items are on sale?",
      options: ["Kitchen appliances", "Office computers", "Winter clothing", "Garden tools"],
      answerIndex: 0
    },
    {
      no: 100,
      question: "How long will the sale continue?",
      options: ["Until Sunday", "For one hour", "Through next month", "Until supplies arrive"],
      answerIndex: 0
    }
  ], { topic: "department store kitchen appliance sale", talkType: "announcement", skill: "talk details" });

  window.TOEIC_LISTENING_EXAMS.y2018 = {
    meta: {
      id: "y2018",
      label: "TOEIC Listening 2018",
      fullLabel: "TOEIC Test 2018",
      hasListening: true,
      listeningParts: ["1", "2", "3", "4"]
    },
    questions
  };
})();
