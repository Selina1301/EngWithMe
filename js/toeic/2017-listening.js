// TOEIC Listening 2017 data.
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
      return `audio/toeic/2017/part${partNumber}/question-${String(questionNo).padStart(3, "0")}.mp3?v=${audioVersion}`;
    }

    const range = String(group || "").match(/(\d+)-(\d+)/);
    if (range) {
      return `audio/toeic/2017/part${partNumber}/questions-${String(range[1]).padStart(3, "0")}-${String(range[2]).padStart(3, "0")}.mp3?v=${audioVersion}`;
    }

    return `audio/toeic/2017/part${partNumber}/question-${String(questionNo).padStart(3, "0")}.mp3?v=${audioVersion}`;
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
    "Some people are waiting in line at a counter.",
    "A man is pointing at a document on the table.",
    "A woman is placing food on a plate.",
    "Several workers are repairing the ceiling."
  ], 1, {
    imageUrl: "images/toeic/2017/part1/question-001.png",
    topic: "office meeting",
    skill: "photo description",
    explain: "The picture shows a man pointing at a document on a conference table."
  });

  add(1, 2, "Which statement best describes the picture?", [
    "A woman is selecting a beverage from a shelf.",
    "A cashier is scanning some groceries.",
    "Some vegetables are being loaded onto a truck.",
    "A customer is paying for her purchase."
  ], 0, {
    imageUrl: "images/toeic/2017/part1/question-002.png",
    topic: "shopping",
    skill: "photo description",
    explain: "The picture shows a woman choosing a drink from a supermarket shelf."
  });

  add(1, 3, "Which statement best describes the picture?", [
    "A train is parked beside a platform.",
    "Passengers are boarding a bus.",
    "A worker is cleaning the windows of a train.",
    "Some luggage has been placed on a bench."
  ], 0, {
    imageUrl: "images/toeic/2017/part1/question-003.png",
    topic: "transportation",
    skill: "photo description",
    explain: "The picture shows a train stopped next to a platform."
  });

  add(1, 4, "Which statement best describes the picture?", [
    "A building is being demolished.",
    "A machine is moving soil at a construction site.",
    "Workers are painting the outside of a house.",
    "A crane is lifting materials onto a roof."
  ], 1, {
    imageUrl: "images/toeic/2017/part1/question-004.png",
    topic: "construction",
    skill: "photo description",
    explain: "The picture shows an excavator moving soil at a construction site."
  });

  add(1, 5, "Which statement best describes the picture?", [
    "A chef is arranging food on a plate.",
    "A waiter is taking an order from a customer.",
    "A man is washing dishes in a sink.",
    "Some vegetables are being chopped on a board."
  ], 0, {
    imageUrl: "images/toeic/2017/part1/question-005.png",
    topic: "restaurant kitchen",
    skill: "photo description",
    explain: "The picture shows a chef placing food carefully on a plate."
  });

  add(1, 6, "Which statement best describes the picture?", [
    "Some passengers are standing in line at a service counter.",
    "A woman is checking the tires of a vehicle.",
    "A man is placing bags onto a shelf.",
    "Several people are seated in a waiting area."
  ], 0, {
    imageUrl: "images/toeic/2017/part1/question-006.png",
    topic: "airport",
    skill: "photo description",
    explain: "The picture shows passengers waiting in line at an airport service counter."
  });

  add(2, 7, "When will the staff meeting begin?", [
    "In the conference room.",
    "At nine thirty.",
    "About the new schedule."
  ], 1, {
    trapType: "when question",
    explain: "The question asks about time, so \"At nine thirty\" is correct."
  });

  add(2, 8, "Who approved the travel request?", [
    "Ms. Peterson did.",
    "It was delayed.",
    "For three days."
  ], 0, {
    trapType: "who question",
    explain: "The question asks who approved the request, so a person is needed."
  });

  add(2, 9, "Could you send me the updated price list?", [
    "Sure, I'll email it now.",
    "No, I didn't buy it.",
    "It costs twenty dollars."
  ], 0, {
    trapType: "request",
    explain: "The best response accepts the request and says the list will be emailed."
  });

  add(2, 10, "Where should I put these folders?", [
    "Yes, they are organized.",
    "On the shelf by the printer.",
    "The folder is blue."
  ], 1, {
    trapType: "where question",
    explain: "The question asks for a place, so \"On the shelf by the printer\" is correct."
  });

  add(2, 11, "Why was the presentation postponed?", [
    "Because the projector was not working.",
    "It starts at two o'clock.",
    "In the main auditorium."
  ], 0, {
    trapType: "why question",
    explain: "The response gives the reason the presentation was postponed."
  });

  add(2, 12, "Has the shipment arrived yet?", [
    "No, it should be here tomorrow.",
    "Yes, I shipped it yesterday.",
    "At the loading dock."
  ], 0, {
    trapType: "yes/no question",
    explain: "The answer directly responds that the shipment has not arrived yet."
  });

  add(2, 13, "Would you like me to reserve a table for lunch?", [
    "That would be great, thanks.",
    "I already ate breakfast.",
    "The table is near the window."
  ], 0, {
    trapType: "offer",
    explain: "The response accepts the offer to reserve a table."
  });

  add(2, 14, "How many copies do we need?", [
    "By Friday afternoon.",
    "About fifty.",
    "In the copy room."
  ], 1, {
    trapType: "how many question",
    explain: "The question asks for a number, so \"About fifty\" is correct."
  });

  add(2, 15, "I think the printer is out of paper.", [
    "I'll refill it now.",
    "It was printed yesterday.",
    "No, I don't read newspapers."
  ], 0, {
    trapType: "statement response",
    explain: "The speaker offers to fix the paper problem."
  });

  add(2, 16, "Did you finish reviewing the contract?", [
    "Yes, I sent my comments this morning.",
    "No, the conference is next week.",
    "It's on the second floor."
  ], 0, {
    trapType: "yes/no question",
    explain: "The response confirms the review was finished and comments were sent."
  });

  add(2, 17, "Which train should we take to the client's office?", [
    "The express train leaves at 8:15.",
    "The office is closed today.",
    "I trained the new employee."
  ], 0, {
    trapType: "similar sound",
    explain: "The response identifies the train to take; \"trained\" is a sound trap."
  });

  add(2, 18, "The manager wants to see the sales report.", [
    "I'll bring it to her office.",
    "Sales have increased.",
    "She saw it yesterday."
  ], 0, {
    trapType: "statement response",
    explain: "The best response says what the speaker will do with the report."
  });

  add(2, 19, "Why don't we move the interview to Thursday?", [
    "That works better for me.",
    "It's near the elevator.",
    "I interviewed three people."
  ], 0, {
    trapType: "suggestion",
    explain: "The response agrees with the suggestion to move the interview."
  });

  add(2, 20, "Is the marketing team ready for the product launch?", [
    "Yes, everything is prepared.",
    "The product is expensive.",
    "In the downtown branch."
  ], 0, {
    trapType: "yes/no question",
    explain: "The answer confirms the team is ready."
  });

  add(2, 21, "Where can I find the customer survey results?", [
    "They're saved in the shared folder.",
    "The customers were satisfied.",
    "I found a new customer."
  ], 0, {
    trapType: "where question",
    explain: "The response gives the location of the results."
  });

  add(2, 22, "Should we order more office supplies this week?", [
    "Yes, we're almost out of pens.",
    "The office is on the third floor.",
    "I supplied the information."
  ], 0, {
    trapType: "yes/no question",
    explain: "The response gives a reason to order more supplies."
  });

  add(2, 23, "When is Mr. Lane returning from his business trip?", [
    "Tomorrow afternoon.",
    "At the airport terminal.",
    "He returned the equipment."
  ], 0, {
    trapType: "when question",
    explain: "The question asks when, and the answer gives a time."
  });

  add(2, 24, "Who is responsible for updating the website?", [
    "The design team is.",
    "It was updated yesterday.",
    "The website looks modern."
  ], 0, {
    trapType: "who question",
    explain: "The response identifies the responsible team."
  });

  add(2, 25, "The training session has been moved to Room 204.", [
    "Thanks for letting me know.",
    "I trained him last month.",
    "The room has a large window."
  ], 0, {
    trapType: "statement response",
    explain: "The best response acknowledges the new room information."
  });

  add(2, 26, "Have you contacted the supplier?", [
    "Yes, I spoke with them this morning.",
    "The supplies are in the cabinet.",
    "Contact lenses are expensive."
  ], 0, {
    trapType: "similar sound",
    explain: "The answer confirms the supplier was contacted."
  });

  add(2, 27, "What time does the store close today?", [
    "At seven o'clock.",
    "The store is nearby.",
    "I closed the file."
  ], 0, {
    trapType: "what time question",
    explain: "The response gives the closing time."
  });

  add(2, 28, "Could you help me set up the projector?", [
    "Of course. Give me a minute.",
    "The project is finished.",
    "I saw the projection screen."
  ], 0, {
    trapType: "request",
    explain: "The response agrees to help set up the projector."
  });

  add(2, 29, "Why is the lobby so crowded?", [
    "A conference just ended.",
    "It's on the first floor.",
    "The crowd was very loud."
  ], 0, {
    trapType: "why question",
    explain: "The answer gives the reason the lobby is crowded."
  });

  add(2, 30, "Do you want the receipt in your bag?", [
    "No, I'll keep it in my wallet.",
    "The bag is on sale.",
    "I received the package."
  ], 0, {
    trapType: "yes/no question",
    explain: "The response answers the question about where to put the receipt."
  });

  add(2, 31, "How long will the repair take?", [
    "About two hours.",
    "At the repair shop.",
    "The equipment is repaired."
  ], 0, {
    trapType: "how long question",
    explain: "The question asks for a duration, so \"About two hours\" is correct."
  });

  addSet(3, "Questions 32-34", `W: Hi, I'm here to pick up the brochures for tomorrow's trade show.
M: They're almost ready, but the printer had a problem with the color on the front page.
W: Oh, no. Will they be finished by this afternoon?
M: Yes. We're reprinting them now, and I'll call you as soon as they're packed.`, [
    { no: 32, question: "What is the woman picking up?", options: ["Business cards", "Brochures", "Tickets", "Product samples"], answerIndex: 1, explain: "The woman says she is there to pick up the brochures." },
    { no: 33, question: "What problem occurred?", options: ["A machine was delivered late.", "A meeting room was unavailable.", "The color on a page was incorrect.", "Some documents were missing."], answerIndex: 2, explain: "The man says the printer had a problem with the color on the front page." },
    { no: 34, question: "What will the man probably do later?", options: ["Call the woman", "Attend a trade show", "Design a new logo", "Cancel an order"], answerIndex: 0, explain: "The man says he will call the woman when the brochures are packed.", skill: "next action" }
  ], { topic: "printing order" });

  addSet(3, "Questions 35-37", `M: Excuse me, I booked a room under the name Daniel Carter.
W: Let me check. Yes, Mr. Carter, you reserved a standard room for two nights.
M: Actually, I requested a room with a view of the river.
W: I see the note here. We have one available, but there is an additional charge of twenty dollars per night.`, [
    { no: 35, question: "Where most likely are the speakers?", options: ["At a hotel", "At a bank", "At a travel agency", "At a restaurant"], answerIndex: 0, explain: "They discuss a room reservation, so they are most likely at a hotel.", skill: "location" },
    { no: 36, question: "What did the man request?", options: ["A later checkout time", "A room with a river view", "A lower room rate", "A reservation for one night"], answerIndex: 1, explain: "The man says he requested a room with a view of the river." },
    { no: 37, question: "What does the woman say about the request?", options: ["It is no longer possible.", "It requires an extra fee.", "It was made too late.", "It has already been canceled."], answerIndex: 1, explain: "The woman says there is an additional charge of twenty dollars per night." }
  ], { topic: "hotel reservation" });

  addSet(3, "Questions 38-40", `W: We need to choose a location for next month's training seminar.
M: How about the Northside Conference Center? It has large rooms and free parking.
W: That sounds good, but it's far from the train station.
M: True. The downtown hotel is more convenient, but it costs almost twice as much.`, [
    { no: 38, question: "What are the speakers discussing?", options: ["Hiring a trainer", "Selecting a seminar location", "Changing a hotel reservation", "Preparing training materials"], answerIndex: 1, explain: "The woman says they need to choose a location for a training seminar." },
    { no: 39, question: "What is mentioned about the Northside Conference Center?", options: ["It has free parking.", "It is close to a train station.", "It is very expensive.", "It is fully booked."], answerIndex: 0, explain: "The man says the center has large rooms and free parking." },
    { no: 40, question: "What concern does the woman have?", options: ["The rooms are too small.", "The schedule is too full.", "The location is not convenient by train.", "The equipment is not available."], answerIndex: 2, explain: "The woman says the center is far from the train station." }
  ], { topic: "seminar planning" });

  addSet(3, "Questions 41-43", `M: Did you receive the revised budget proposal?
W: Yes, but I haven't had time to review it carefully.
M: The finance director wants our feedback before noon.
W: In that case, I'll look at it right away and send you my comments within an hour.`, [
    { no: 41, question: "What document are the speakers discussing?", options: ["A sales report", "A budget proposal", "A training schedule", "A contract form"], answerIndex: 1, explain: "The speakers discuss the revised budget proposal." },
    { no: 42, question: "What does the man say about the finance director?", options: ["She wants feedback soon.", "She is out of the office.", "She approved the proposal.", "She will attend a meeting."], answerIndex: 0, explain: "The man says the finance director wants feedback before noon." },
    { no: 43, question: "What will the woman do next?", options: ["Call a client", "Review a document", "Prepare an invoice", "Schedule a meeting"], answerIndex: 1, explain: "The woman says she will look at the proposal right away.", skill: "next action" }
  ], { topic: "budget review" });

  addSet(3, "Questions 44-46", `W: I'm calling about the delivery of our office chairs. They were supposed to arrive yesterday.
M: I'm sorry for the delay. The truck had a mechanical problem, but it's back on the road now.
W: Do you know when we can expect the chairs?
M: They should arrive by three o'clock this afternoon.`, [
    { no: 44, question: "Why is the woman calling?", options: ["To order office chairs", "To report a damaged item", "To ask about a delayed delivery", "To change a shipping address"], answerIndex: 2, explain: "The woman says the office chairs were supposed to arrive yesterday." },
    { no: 45, question: "What caused the delay?", options: ["Bad weather", "A truck problem", "An incorrect address", "A missing invoice"], answerIndex: 1, explain: "The man says the truck had a mechanical problem." },
    { no: 46, question: "When should the delivery arrive?", options: ["This morning", "By noon", "By three o'clock", "Tomorrow"], answerIndex: 2, explain: "The man says the chairs should arrive by three o'clock this afternoon." }
  ], { topic: "delivery delay" });

  addSet(3, "Questions 47-49", `M: I noticed that the cafeteria menu has changed.
W: Yes, the company hired a new food service provider.
M: That explains it. The prices seem a little higher now.
W: They are, but the new provider is offering healthier meals and longer service hours.`, [
    { no: 47, question: "What are the speakers talking about?", options: ["A new office location", "Changes to a cafeteria", "A staff meeting", "A health insurance plan"], answerIndex: 1, explain: "They discuss the changed cafeteria menu and new food service provider." },
    { no: 48, question: "What does the man mention?", options: ["The prices have increased.", "The food is served too late.", "The menu has fewer items.", "The cafeteria is closed."], answerIndex: 0, explain: "The man says the prices seem a little higher now." },
    { no: 49, question: "What does the woman say about the new provider?", options: ["It has reduced its hours.", "It offers healthier meals.", "It is located downtown.", "It gives employee discounts."], answerIndex: 1, explain: "The woman says the new provider offers healthier meals and longer service hours." }
  ], { topic: "cafeteria changes" });

  addSet(3, "Questions 50-52", `M: Hi, I'm calling to ask about the laptop I brought in for repair last week.
W: Let me check the record. Is this for the Henderson account?
M: Yes, that's right. I was told it would be ready today.
W: The technician replaced the keyboard, but he still needs to test the battery. It should be ready tomorrow morning.`, [
    { no: 50, question: "Why is the man calling?", options: ["To order a new laptop", "To check on a repair", "To ask about a warranty", "To cancel a service appointment"], answerIndex: 1, explain: "The man asks about a laptop he brought in for repair." },
    { no: 51, question: "What part was replaced?", options: ["The screen", "The battery", "The keyboard", "The charger"], answerIndex: 2, explain: "The woman says the technician replaced the keyboard." },
    { no: 52, question: "When will the laptop probably be ready?", options: ["This afternoon", "Tomorrow morning", "Next week", "In two hours"], answerIndex: 1, explain: "The woman says it should be ready tomorrow morning." }
  ], { topic: "computer repair" });

  addSet(3, "Questions 53-55", `W: We need someone to lead the customer service workshop next Tuesday.
M: I thought Ms. Grant was going to do that.
W: She has to attend a meeting at the regional office.
M: In that case, I can lead the workshop, but I'll need the training slides by Friday.`, [
    { no: 53, question: "What are the speakers discussing?", options: ["A workshop leader", "A regional sales report", "A customer complaint", "A new office policy"], answerIndex: 0, explain: "They are discussing who will lead the customer service workshop." },
    { no: 54, question: "Why can't Ms. Grant lead the workshop?", options: ["She is on vacation.", "She has another meeting.", "She is preparing the slides.", "She is visiting a customer."], answerIndex: 1, explain: "The woman says Ms. Grant has to attend a meeting at the regional office." },
    { no: 55, question: "What does the man request?", options: ["A larger room", "More participants", "Training slides", "Customer records"], answerIndex: 2, explain: "The man says he will need the training slides by Friday." }
  ], { topic: "workshop planning" });

  addSet(3, "Questions 56-58", `M: I saw the notice about the parking lot being closed on Monday.
W: Yes, the maintenance team will repaint the lines.
M: Where should employees park that day?
W: We can use the visitor lot behind the building, but we need to display our employee badges on the dashboard.`, [
    { no: 56, question: "What will happen on Monday?", options: ["A building will be inspected.", "A parking lot will be closed.", "A visitor center will open.", "Employee badges will be replaced."], answerIndex: 1, explain: "The man says the parking lot will be closed on Monday." },
    { no: 57, question: "Why will the parking lot be closed?", options: ["Lines will be repainted.", "Lights will be installed.", "Trees will be removed.", "The surface will be repaired."], answerIndex: 0, explain: "The woman says the maintenance team will repaint the lines." },
    { no: 58, question: "What should employees do?", options: ["Arrive after noon", "Park on the street", "Display their badges", "Use public transportation"], answerIndex: 2, explain: "The woman says employees need to display their badges on the dashboard." }
  ], { topic: "parking notice" });

  addSet(3, "Questions 59-61", `W: Have you looked at the agenda for tomorrow's department meeting?
M: Not yet. Is there anything important?
W: The director wants to discuss the new vacation request procedure.
M: Oh, then I should read it carefully. Several people on my team have questions about that.`, [
    { no: 59, question: "What are the speakers talking about?", options: ["A meeting agenda", "A vacation package", "A hiring plan", "A travel schedule"], answerIndex: 0, explain: "They are talking about the agenda for a department meeting." },
    { no: 60, question: "What topic will be discussed?", options: ["Office relocation", "Vacation requests", "Budget reductions", "Staff uniforms"], answerIndex: 1, explain: "The director wants to discuss the new vacation request procedure." },
    { no: 61, question: "Why is the man interested in the topic?", options: ["He wrote the procedure.", "He is going on vacation.", "His team has questions.", "His department is moving."], answerIndex: 2, explain: "The man says several people on his team have questions about the topic." }
  ], { topic: "department meeting" });

  addSet(3, "Questions 62-64", `M: I'm here to pick up an order for Parkside Cafe.
W: Was it the order for twelve boxes of coffee cups?
M: Yes, and we also requested some paper napkins.
W: The cups are ready, but the napkins won't arrive until this afternoon. Would you like to pick everything up later?`, [
    { no: 62, question: "Where most likely does the conversation take place?", options: ["At a supply store", "At a restaurant", "At a hotel", "At a bank"], answerIndex: 0, explain: "They discuss boxes of coffee cups and paper napkins, so this is likely at a supply store.", skill: "location" },
    { no: 63, question: "What did the man order?", options: ["Coffee beans", "Paper products", "Kitchen equipment", "Cleaning supplies"], answerIndex: 1, explain: "The order includes coffee cups and paper napkins." },
    { no: 64, question: "What does the woman suggest?", options: ["Canceling the order", "Returning in the afternoon", "Calling another branch", "Buying a different brand"], answerIndex: 1, explain: "The woman asks whether the man would like to pick everything up later." }
  ], { topic: "supply order" });

  addSet(3, "Questions 65-67", `W: The new product photos look good, but I think the descriptions are too long.
M: I agree. Online shoppers usually prefer short descriptions with clear details.
W: Could you ask the marketing assistant to shorten them before we upload the page?
M: Sure. I'll ask him to finish it by the end of the day.`, [
    { no: 65, question: "What are the speakers reviewing?", options: ["Product photos and descriptions", "Customer survey results", "A printed advertisement", "A store display"], answerIndex: 0, explain: "They discuss product photos and product descriptions." },
    { no: 66, question: "What change does the woman want?", options: ["Brighter photos", "Shorter descriptions", "Lower prices", "More product colors"], answerIndex: 1, explain: "The woman says the descriptions are too long." },
    { no: 67, question: "What will the man do?", options: ["Upload the page himself", "Contact the marketing assistant", "Take new photographs", "Meet with online shoppers"], answerIndex: 1, explain: "The man says he will ask the marketing assistant to shorten them.", skill: "next action" }
  ], { topic: "online product page" });

  addSet(3, "Questions 68-70", `M: Did you hear that the accounting software will be updated this weekend?
W: Yes. We won't be able to access it from Friday evening until Monday morning.
M: That might be a problem. I need to submit expense reports by Monday.
W: You should enter them before the system shuts down on Friday.`, [
    { no: 68, question: "What is being updated?", options: ["Accounting software", "Security cameras", "Office computers", "Employee records"], answerIndex: 0, explain: "The man says the accounting software will be updated." },
    { no: 69, question: "When will the system be unavailable?", options: ["On Monday afternoon", "During the weekend", "For one hour on Friday", "All next week"], answerIndex: 1, explain: "The woman says access will stop from Friday evening until Monday morning." },
    { no: 70, question: "What does the woman suggest the man do?", options: ["Submit his reports early", "Ask for a deadline extension", "Call the software company", "Print the employee records"], answerIndex: 0, explain: "She suggests entering the reports before the system shuts down on Friday." }
  ], { topic: "software update" });

  addSet(4, "Questions 71-73", `Good morning, everyone. This is a reminder that the quarterly safety training will take place this Friday at 10 A.M. in Conference Room B. All employees who work in the warehouse are required to attend. Please bring your employee identification card, as attendance will be recorded at the entrance. The session will last approximately ninety minutes.`, [
    { no: 71, question: "What is the announcement mainly about?", options: ["A safety training session", "A company picnic", "A warehouse inspection", "A new identification system"], answerIndex: 0, explain: "The announcement is mainly about quarterly safety training.", skill: "main idea" },
    { no: 72, question: "Who is required to attend?", options: ["All new customers", "Warehouse employees", "Conference visitors", "Human resources staff"], answerIndex: 1, explain: "All employees who work in the warehouse are required to attend." },
    { no: 73, question: "What should participants bring?", options: ["A notebook", "A lunch ticket", "An identification card", "A training manual"], answerIndex: 2, explain: "Participants are asked to bring an employee identification card." }
  ], { talkType: "announcement", topic: "safety training" });

  addSet(4, "Questions 74-76", `Hello, Ms. Rivera. This is Tom from Benton Office Supplies. I'm calling about the order you placed for twenty desk lamps. Unfortunately, the silver model is currently out of stock. We can send the black model immediately, or we can ship the silver lamps next Wednesday. Please call me back by the end of the day and let me know which option you prefer.`, [
    { no: 74, question: "Why is the speaker calling?", options: ["To confirm a payment", "To discuss a product order", "To schedule a repair", "To request an address"], answerIndex: 1, explain: "The caller is discussing an order for desk lamps." },
    { no: 75, question: "What problem is mentioned?", options: ["A model is unavailable.", "A payment was declined.", "A shipment was damaged.", "An address was incorrect."], answerIndex: 0, explain: "The silver model is currently out of stock." },
    { no: 76, question: "What is Ms. Rivera asked to do?", options: ["Visit a store", "Return a product", "Call back with a decision", "Send a new invoice"], answerIndex: 2, explain: "She is asked to call back and say which option she prefers." }
  ], { talkType: "telephone message", topic: "office supply order" });

  addSet(4, "Questions 77-79", `Looking for a convenient place to hold your next business event? The Grandview Hotel offers modern meeting rooms, high-speed Internet access, and full catering service. Our largest room can accommodate up to two hundred guests. Book your event before the end of this month and receive a fifteen percent discount on room rental fees. Call our events office today for more information.`, [
    { no: 77, question: "What is being advertised?", options: ["A hotel event service", "A restaurant opening", "A computer repair shop", "A travel package"], answerIndex: 0, explain: "The advertisement promotes meeting rooms and event services at a hotel." },
    { no: 78, question: "What is available at the Grandview Hotel?", options: ["Free train tickets", "Full catering service", "Apartment rentals", "Outdoor parking only"], answerIndex: 1, explain: "The hotel offers full catering service." },
    { no: 79, question: "How can customers receive a discount?", options: ["By booking before the end of the month", "By joining a cooking class", "By paying in cash", "By reserving a single room"], answerIndex: 0, explain: "Customers receive a discount by booking before the end of the month." }
  ], { talkType: "advertisement", topic: "hotel events" });

  addSet(4, "Questions 80-82", `City officials announced today that renovation work on the Central Avenue Bridge will begin next Monday. During the project, one lane will remain open in each direction, but drivers should expect delays during morning and evening rush hours. The work is expected to continue for six weeks. Officials recommend that commuters use the Riverside Tunnel as an alternate route.`, [
    { no: 80, question: "What will happen next Monday?", options: ["A new bridge will open.", "Renovation work will begin.", "Bus service will be canceled.", "A tunnel will be closed."], answerIndex: 1, explain: "Renovation work on the bridge will begin next Monday." },
    { no: 81, question: "What should drivers expect?", options: ["Higher parking fees", "Delays during rush hours", "A new toll system", "Free shuttle service"], answerIndex: 1, explain: "Drivers should expect delays during morning and evening rush hours." },
    { no: 82, question: "What is recommended?", options: ["Using another route", "Traveling by bicycle only", "Avoiding the city for six months", "Parking near Central Avenue"], answerIndex: 0, explain: "Commuters are advised to use the Riverside Tunnel as an alternate route." }
  ], { talkType: "news report", topic: "bridge renovation" });

  addSet(4, "Questions 83-85", `Thank you for calling Westbrook Dental Clinic. Our office is currently closed for staff training. We will reopen tomorrow morning at 8:30. If you would like to schedule or change an appointment, please leave your name, phone number, and preferred appointment time after the tone. For dental emergencies, please call our emergency line at 555-0186.`, [
    { no: 83, question: "Why is the office closed?", options: ["The building is being repaired.", "The staff is attending training.", "The dentist is on vacation.", "The clinic has moved."], answerIndex: 1, explain: "The office is closed because the staff is attending training." },
    { no: 84, question: "When will the office reopen?", options: ["This afternoon", "Tomorrow morning", "Next Monday", "At noon today"], answerIndex: 1, explain: "The clinic will reopen tomorrow morning at 8:30." },
    { no: 85, question: "What should callers with emergencies do?", options: ["Leave a written message", "Visit another branch", "Call the emergency line", "Wait until tomorrow"], answerIndex: 2, explain: "Callers with dental emergencies should call the emergency line." }
  ], { talkType: "recorded message", topic: "dental clinic" });

  addSet(4, "Questions 86-88", `Attention, shoppers. For the next thirty minutes only, all winter jackets in the men's and women's departments are twenty percent off the marked price. This special offer applies only to items on the second floor. Please ask a sales associate if you need help finding a size or style. Thank you for shopping at Morgan's Department Store.`, [
    { no: 86, question: "Where is this announcement probably being made?", options: ["In a department store", "At a train station", "In a hotel lobby", "At a fitness center"], answerIndex: 0, explain: "The speaker thanks customers for shopping at Morgan's Department Store.", skill: "location" },
    { no: 87, question: "What is on sale?", options: ["Shoes", "Winter jackets", "Travel bags", "Kitchen items"], answerIndex: 1, explain: "Winter jackets are twenty percent off." },
    { no: 88, question: "Where are the sale items located?", options: ["Near the entrance", "On the first floor", "On the second floor", "In the parking area"], answerIndex: 2, explain: "The offer applies to items on the second floor." }
  ], { talkType: "announcement", topic: "store sale" });

  addSet(4, "Questions 89-91", `Before we begin today's tour, I'd like to remind everyone of a few museum rules. Photography is allowed in most areas, but please do not use flash. Food and drinks are not permitted inside the exhibit halls. The tour will last about forty-five minutes, and afterward you will have time to visit the gift shop on your own.`, [
    { no: 89, question: "Who is probably speaking?", options: ["A tour guide", "A restaurant manager", "A train conductor", "A photographer"], answerIndex: 0, explain: "The speaker gives rules before a museum tour, so the speaker is probably a tour guide." },
    { no: 90, question: "What are visitors asked not to do?", options: ["Enter the gift shop", "Use flash photography", "Ask questions", "Take the tour"], answerIndex: 1, explain: "Visitors are asked not to use flash photography." },
    { no: 91, question: "What will visitors be able to do after the tour?", options: ["Watch a film", "Meet an artist", "Visit the gift shop", "Eat in the exhibit hall"], answerIndex: 2, explain: "After the tour, visitors will have time to visit the gift shop." }
  ], { talkType: "tour guide speech", topic: "museum tour" });

  addSet(4, "Questions 92-94", `This is a passenger announcement for Flight 482 to Chicago. Boarding will begin in approximately ten minutes at Gate 16. Passengers seated in rows twenty through thirty-five will be invited to board first. Please have your boarding pass and identification ready. We appreciate your cooperation.`, [
    { no: 92, question: "What is the announcement about?", options: ["A flight boarding procedure", "A delayed arrival", "A lost boarding pass", "A gate change"], answerIndex: 0, explain: "The announcement gives boarding information for Flight 482." },
    { no: 93, question: "When will boarding begin?", options: ["Immediately", "In about ten minutes", "In thirty-five minutes", "After the flight arrives"], answerIndex: 1, explain: "Boarding will begin in approximately ten minutes." },
    { no: 94, question: "Who will board first?", options: ["Passengers with children", "First-class passengers", "Passengers in certain rows", "Passengers without luggage"], answerIndex: 2, explain: "Passengers seated in rows twenty through thirty-five will board first." }
  ], { talkType: "public notice", topic: "flight boarding" });

  addSet(4, "Questions 95-97", `As you can see from the chart, online sales increased by twelve percent during the last quarter. However, sales at our physical stores remained almost the same. For the next quarter, we will focus on improving the customer experience in stores. Each branch manager will receive a new training guide by the end of this week.`, [
    { no: 95, question: "What increased last quarter?", options: ["Online sales", "Store rental fees", "Employee salaries", "Training costs"], answerIndex: 0, explain: "Online sales increased by twelve percent last quarter." },
    { no: 96, question: "What will the company focus on next quarter?", options: ["Opening more websites", "Improving store customer experience", "Reducing branch hours", "Hiring more accountants"], answerIndex: 1, explain: "The company will focus on improving the customer experience in stores." },
    { no: 97, question: "What will branch managers receive?", options: ["A new sales chart", "A customer list", "A training guide", "A new computer"], answerIndex: 2, explain: "Each branch manager will receive a new training guide." }
  ], { talkType: "meeting speech", topic: "sales meeting" });

  addSet(4, "Questions 98-100", `Hello, this is Lakeside Fitness Center with an important update. Due to maintenance work on the swimming pool, all morning swim classes will be canceled tomorrow. Afternoon classes will continue as scheduled. Members who are registered for a morning class may attend any class next week at no additional charge. Thank you for your understanding.`, [
    { no: 98, question: "Why are some classes canceled?", options: ["The instructor is sick.", "The swimming pool needs maintenance.", "The center is closing permanently.", "Registration is full."], answerIndex: 1, explain: "Morning swim classes are canceled because the swimming pool needs maintenance." },
    { no: 99, question: "Which classes will still take place?", options: ["Morning swim classes", "Afternoon classes", "Weekend yoga classes", "Private lessons only"], answerIndex: 1, explain: "Afternoon classes will continue as scheduled." },
    { no: 100, question: "What may affected members do?", options: ["Receive a cash refund", "Attend a class next week", "Use another fitness center", "Register for a competition"], answerIndex: 1, explain: "Affected members may attend any class next week at no additional charge." }
  ], { talkType: "recorded message", topic: "fitness center update" });

  window.TOEIC_LISTENING_EXAMS.y2017 = {
    meta: {
      id: "y2017",
      label: "TOEIC Listening 2017",
      fullLabel: "TOEIC Test 2017",
      hasListening: true,
      listeningParts: ["1", "2", "3", "4"]
    },
    questions
  };
})();
