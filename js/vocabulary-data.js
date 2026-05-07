const vocabularyData = {
      easy: {
        title: "Easy Vocabulary",
        subtitle: "Nhóm chủ đề thường dùng nhất trong giao tiếp hằng ngày.",
        label: "Dễ dùng",
        topics: [
          {
            id: "daily-life",
            icon: "ti-agenda",
            name: "Đời sống hằng ngày",
            desc: "Thói quen, gia đình, sinh hoạt và việc thường ngày.",
            words: [
              { word: "routine", phonetic: "/ruːˈtiːn/", meaning: "thói quen", example: "My morning routine starts at 6 a.m.", difficulty: "easy" },
              { word: "neighbor", phonetic: "/ˈneɪ.bər/", meaning: "hàng xóm", example: "My neighbor is very friendly.", difficulty: "easy" },
              { word: "housework", phonetic: "/ˈhaʊs.wɜːrk/", meaning: "việc nhà", example: "I do housework every weekend.", difficulty: "easy" },
              { word: "breakfast", phonetic: "/ˈbrek.fəst/", meaning: "bữa sáng", example: "I usually have breakfast at 7 a.m.", difficulty: "easy" },
              { word: "laundry", phonetic: "/ˈlɔːn.dri/", meaning: "đồ giặt", example: "I need to do the laundry tonight.", difficulty: "easy" },
              { word: "appointment", phonetic: "/əˈpɔɪnt.mənt/", meaning: "cuộc hẹn", example: "I have a doctor appointment tomorrow.", difficulty: "medium" },
              { word: "responsibility", phonetic: "/rɪˌspɑːn.səˈbɪl.ə.ti/", meaning: "trách nhiệm", example: "Cleaning the kitchen is my responsibility.", difficulty: "medium" },
              { word: "balance", phonetic: "/ˈbæl.əns/", meaning: "sự cân bằng", example: "Work-life balance is very important.", difficulty: "medium" },
              { word: "schedule", phonetic: "/ˈskedʒ.uːl/", meaning: "lịch trình", example: "My daily schedule is quite busy.", difficulty: "medium" },
              { word: "discipline", phonetic: "/ˈdɪs.ə.plɪn/", meaning: "kỷ luật", example: "Discipline helps students learn better.", difficulty: "hard" },
              { word: "independence", phonetic: "/ˌɪn.dɪˈpen.dəns/", meaning: "sự tự lập", example: "Living alone taught her independence.", difficulty: "hard" },
              { word: "household expense", phonetic: "/ˈhaʊs.hoʊld ɪkˈspens/", meaning: "chi phí sinh hoạt gia đình", example: "Rent is a major household expense.", difficulty: "hard" }
            ]
          },
          {
            id: "school",
            icon: "ti-blackboard",
            name: "Trường học",
            desc: "Lớp học, môn học, bài tập và việc học tập mỗi ngày.",
            words: [
              { word: "classroom", phonetic: "/ˈklæs.ruːm/", meaning: "lớp học", example: "The students are in the classroom.", difficulty: "easy" },
              { word: "subject", phonetic: "/ˈsʌb.dʒekt/", meaning: "môn học", example: "English is my favorite subject.", difficulty: "easy" },
              { word: "homework", phonetic: "/ˈhoʊm.wɜːrk/", meaning: "bài tập về nhà", example: "I finish my homework before dinner.", difficulty: "easy" },
              { word: "notebook", phonetic: "/ˈnoʊt.bʊk/", meaning: "quyển vở", example: "Please open your notebook.", difficulty: "easy" },
              { word: "teacher", phonetic: "/ˈtiː.tʃɚ/", meaning: "giáo viên", example: "Our teacher is very kind.", difficulty: "easy" },
              { word: "assignment", phonetic: "/əˈsaɪn.mənt/", meaning: "bài tập được giao", example: "I submitted the assignment yesterday.", difficulty: "medium" },
              { word: "presentation", phonetic: "/ˌprez.ənˈteɪ.ʃən/", meaning: "bài thuyết trình", example: "We have a group presentation next week.", difficulty: "medium" },
              { word: "project", phonetic: "/ˈprɑː.dʒekt/", meaning: "dự án học tập", example: "Our science project won first prize.", difficulty: "medium" },
              { word: "semester", phonetic: "/səˈmes.tɚ/", meaning: "học kỳ", example: "This semester is more difficult than the last one.", difficulty: "medium" },
              { word: "curriculum", phonetic: "/kəˈrɪk.jə.ləm/", meaning: "chương trình học", example: "The curriculum focuses on communication skills.", difficulty: "hard" },
              { word: "assessment", phonetic: "/əˈses.mənt/", meaning: "đánh giá", example: "Students took part in a speaking assessment.", difficulty: "hard" },
              { word: "scholarship", phonetic: "/ˈskɑː.lɚ.ʃɪp/", meaning: "học bổng", example: "She received a scholarship to study abroad.", difficulty: "hard" }
            ]
          },
          {
            id: "food",
            icon: "ti-shopping-cart",
            name: "Ăn uống",
            desc: "Bữa ăn, gọi món, món ăn và thói quen ăn uống.",
            words: [
              { word: "meal", phonetic: "/miːl/", meaning: "bữa ăn", example: "Dinner is the biggest meal of the day.", difficulty: "easy" },
              { word: "menu", phonetic: "/ˈmen.juː/", meaning: "thực đơn", example: "Can I see the menu, please?", difficulty: "easy" },
              { word: "drink", phonetic: "/drɪŋk/", meaning: "đồ uống", example: "Would you like a cold drink?", difficulty: "easy" },
              { word: "hungry", phonetic: "/ˈhʌŋ.ɡri/", meaning: "đói", example: "I am very hungry after class.", difficulty: "easy" },
              { word: "recipe", phonetic: "/ˈres.ə.pi/", meaning: "công thức nấu ăn", example: "This recipe is easy to follow.", difficulty: "easy" },
              { word: "ingredient", phonetic: "/ɪnˈɡriː.di.ənt/", meaning: "nguyên liệu", example: "Tomato is the main ingredient in this soup.", difficulty: "medium" },
              { word: "flavor", phonetic: "/ˈfleɪ.vɚ/", meaning: "hương vị", example: "This dish has a rich flavor.", difficulty: "medium" },
              { word: "order", phonetic: "/ˈɔːr.dɚ/", meaning: "gọi món", example: "I want to order fried rice.", difficulty: "medium" },
              { word: "portion", phonetic: "/ˈpɔːr.ʃən/", meaning: "khẩu phần", example: "The portion is too large for one person.", difficulty: "medium" },
              { word: "nutritious", phonetic: "/nuːˈtrɪʃ.əs/", meaning: "bổ dưỡng", example: "A nutritious breakfast gives you energy.", difficulty: "hard" },
              { word: "allergy", phonetic: "/ˈæl.ɚ.dʒi/", meaning: "dị ứng", example: "She has an allergy to seafood.", difficulty: "hard" },
              { word: "carbohydrate", phonetic: "/ˌkɑːr.boʊˈhaɪ.dreɪt/", meaning: "carbohydrate", example: "Rice is a common source of carbohydrate.", difficulty: "hard" }
            ]
          },
          {
            id: "fruits",
            icon: "ti-heart",
            name: "Loại quả",
            desc: "Từ vựng về trái cây thường gặp trong đời sống, mua sắm và ăn uống.",
            words: [
              { word: "apple", phonetic: "/ˈæp.əl/", meaning: "quả táo", example: "I eat an apple every morning.", difficulty: "easy" },
              { word: "banana", phonetic: "/bəˈnæn.ə/", meaning: "quả chuối", example: "Bananas are good for breakfast.", difficulty: "easy" },
              { word: "orange", phonetic: "/ˈɔːr.ɪndʒ/", meaning: "quả cam", example: "She drinks orange juice.", difficulty: "easy" },
              { word: "mango", phonetic: "/ˈmæŋ.ɡoʊ/", meaning: "quả xoài", example: "Mango is popular in Vietnam.", difficulty: "easy" },
              { word: "grape", phonetic: "/ɡreɪp/", meaning: "quả nho", example: "I bought some grapes at the market.", difficulty: "easy" },
              { word: "pineapple", phonetic: "/ˈpaɪnˌæp.əl/", meaning: "quả dứa", example: "Pineapple tastes sweet and sour.", difficulty: "medium" },
              { word: "watermelon", phonetic: "/ˈwɑː.t̬ɚˌmel.ən/", meaning: "dưa hấu", example: "Watermelon is refreshing in summer.", difficulty: "medium" },
              { word: "coconut", phonetic: "/ˈkoʊ.kə.nʌt/", meaning: "quả dừa", example: "Coconut water is very fresh.", difficulty: "medium" },
              { word: "avocado", phonetic: "/ˌæv.əˈkɑː.doʊ/", meaning: "quả bơ", example: "Avocado is often used in healthy meals.", difficulty: "medium" },
              { word: "pomegranate", phonetic: "/ˈpɑː.məˌɡræn.ɪt/", meaning: "quả lựu", example: "Pomegranate juice is rich in flavor.", difficulty: "hard" },
              { word: "persimmon", phonetic: "/pɚˈsɪm.ən/", meaning: "quả hồng", example: "Persimmon is common in autumn.", difficulty: "hard" },
              { word: "dragon fruit", phonetic: "/ˈdræɡ.ən fruːt/", meaning: "thanh long", example: "Dragon fruit has a bright pink skin.", difficulty: "hard" }
            ]
          },
          {
            id: "flowers",
            icon: "ti-spray",
            name: "Loài hoa",
            desc: "Từ vựng về hoa, màu sắc và mô tả vẻ đẹp tự nhiên.",
            words: [
              { word: "rose", phonetic: "/roʊz/", meaning: "hoa hồng", example: "He gave her a red rose.", difficulty: "easy" },
              { word: "flower", phonetic: "/ˈflaʊ.ɚ/", meaning: "bông hoa", example: "This flower smells nice.", difficulty: "easy" },
              { word: "leaf", phonetic: "/liːf/", meaning: "chiếc lá", example: "A leaf fell from the tree.", difficulty: "easy" },
              { word: "garden", phonetic: "/ˈɡɑːr.dən/", meaning: "khu vườn", example: "My mother grows flowers in the garden.", difficulty: "easy" },
              { word: "sunflower", phonetic: "/ˈsʌnˌflaʊ.ɚ/", meaning: "hoa hướng dương", example: "Sunflowers turn toward the sun.", difficulty: "easy" },
              { word: "orchid", phonetic: "/ˈɔːr.kɪd/", meaning: "hoa lan", example: "The orchid looks elegant.", difficulty: "medium" },
              { word: "tulip", phonetic: "/ˈtuː.lɪp/", meaning: "hoa tulip", example: "Tulips bloom in spring.", difficulty: "medium" },
              { word: "fragrance", phonetic: "/ˈfreɪ.ɡrəns/", meaning: "hương thơm", example: "The fragrance of the flowers filled the room.", difficulty: "medium" },
              { word: "blossom", phonetic: "/ˈblɑː.səm/", meaning: "hoa nở", example: "Cherry blossoms appear in spring.", difficulty: "medium" },
              { word: "botanical", phonetic: "/bəˈtæn.ɪ.kəl/", meaning: "thuộc về thực vật", example: "We visited a botanical garden.", difficulty: "hard" },
              { word: "pollination", phonetic: "/ˌpɑː.ləˈneɪ.ʃən/", meaning: "sự thụ phấn", example: "Bees help with pollination.", difficulty: "hard" },
              { word: "petal", phonetic: "/ˈpet̬.əl/", meaning: "cánh hoa", example: "The flower has soft white petals.", difficulty: "hard" }
            ]
          },
          {
            id: "plants",
            icon: "ti-world",
            name: "Cây cối",
            desc: "Từ vựng về cây, rừng, thiên nhiên và môi trường xung quanh.",
            words: [
              { word: "tree", phonetic: "/triː/", meaning: "cây", example: "There is a big tree near my house.", difficulty: "easy" },
              { word: "plant", phonetic: "/plænt/", meaning: "cây trồng", example: "I water my plant every day.", difficulty: "easy" },
              { word: "grass", phonetic: "/ɡræs/", meaning: "cỏ", example: "The grass is green after the rain.", difficulty: "easy" },
              { word: "root", phonetic: "/ruːt/", meaning: "rễ cây", example: "Roots help plants absorb water.", difficulty: "easy" },
              { word: "forest", phonetic: "/ˈfɔːr.ɪst/", meaning: "rừng", example: "Many animals live in the forest.", difficulty: "easy" },
              { word: "branch", phonetic: "/bræntʃ/", meaning: "cành cây", example: "A bird is sitting on the branch.", difficulty: "medium" },
              { word: "seed", phonetic: "/siːd/", meaning: "hạt giống", example: "Farmers plant seeds in spring.", difficulty: "medium" },
              { word: "soil", phonetic: "/sɔɪl/", meaning: "đất trồng", example: "Good soil helps plants grow.", difficulty: "medium" },
              { word: "harvest", phonetic: "/ˈhɑːr.vəst/", meaning: "thu hoạch", example: "Farmers harvest rice in the autumn.", difficulty: "medium" },
              { word: "vegetation", phonetic: "/ˌvedʒ.əˈteɪ.ʃən/", meaning: "thảm thực vật", example: "The island has rich vegetation.", difficulty: "hard" },
              { word: "photosynthesis", phonetic: "/ˌfoʊ.t̬oʊˈsɪn.θə.sɪs/", meaning: "quang hợp", example: "Plants use photosynthesis to make food.", difficulty: "hard" },
              { word: "ecosystem", phonetic: "/ˈiː.koʊˌsɪs.təm/", meaning: "hệ sinh thái", example: "Forests are important ecosystems.", difficulty: "hard" }
            ]
          },
          {
            id: "animals",
            icon: "ti-github",
            name: "Con vật",
            desc: "Từ vựng về vật nuôi, động vật hoang dã và mô tả loài vật.",
            words: [
              { word: "dog", phonetic: "/dɔːɡ/", meaning: "chó", example: "My dog likes running in the park.", difficulty: "easy" },
              { word: "cat", phonetic: "/kæt/", meaning: "mèo", example: "The cat is sleeping on the sofa.", difficulty: "easy" },
              { word: "bird", phonetic: "/bɝːd/", meaning: "chim", example: "A bird is singing outside.", difficulty: "easy" },
              { word: "fish", phonetic: "/fɪʃ/", meaning: "cá", example: "There are many fish in the lake.", difficulty: "easy" },
              { word: "cow", phonetic: "/kaʊ/", meaning: "bò", example: "The cow is eating grass.", difficulty: "easy" },
              { word: "wildlife", phonetic: "/ˈwaɪld.laɪf/", meaning: "động vật hoang dã", example: "The park protects local wildlife.", difficulty: "medium" },
              { word: "species", phonetic: "/ˈspiː.ʃiːz/", meaning: "loài", example: "This species is rare.", difficulty: "medium" },
              { word: "habitat", phonetic: "/ˈhæb.ə.tæt/", meaning: "môi trường sống", example: "Forests are the natural habitat of many animals.", difficulty: "medium" },
              { word: "pet", phonetic: "/pet/", meaning: "thú cưng", example: "A hamster can be a good pet.", difficulty: "medium" },
              { word: "predator", phonetic: "/ˈpred.ə.t̬ɚ/", meaning: "động vật săn mồi", example: "A lion is a powerful predator.", difficulty: "hard" },
              { word: "endangered", phonetic: "/ɪnˈdeɪn.dʒɚd/", meaning: "có nguy cơ tuyệt chủng", example: "Pandas are endangered animals.", difficulty: "hard" },
              { word: "domesticated", phonetic: "/dəˈmes.tɪ.keɪ.t̬ɪd/", meaning: "được thuần hóa", example: "Dogs are domesticated animals.", difficulty: "hard" }
            ]
          }
        ]
      },

      medium: {
        title: "Medium Vocabulary",
        subtitle: "Nhóm từ dùng trong tình huống thực tế như công việc, du lịch và sức khỏe.",
        label: "Thực tế",
        topics: [
          {
            id: "travel",
            icon: "ti-location-arrow",
            name: "Du lịch",
            desc: "Sân bay, khách sạn, đặt vé và hành trình.",
            words: [
              { word: "ticket", phonetic: "/ˈtɪk.ɪt/", meaning: "vé", example: "I bought a train ticket online.", difficulty: "easy" },
              { word: "hotel", phonetic: "/hoʊˈtel/", meaning: "khách sạn", example: "We stayed at a small hotel near the beach.", difficulty: "easy" },
              { word: "passport", phonetic: "/ˈpæs.pɔːrt/", meaning: "hộ chiếu", example: "You need a passport to fly abroad.", difficulty: "easy" },
              { word: "luggage", phonetic: "/ˈlʌɡ.ɪdʒ/", meaning: "hành lý", example: "My luggage is very heavy.", difficulty: "easy" },
              { word: "map", phonetic: "/mæp/", meaning: "bản đồ", example: "I used a map to find the museum.", difficulty: "easy" },
              { word: "reservation", phonetic: "/ˌrez.ɚˈveɪ.ʃən/", meaning: "đặt chỗ", example: "I have a hotel reservation for two nights.", difficulty: "medium" },
              { word: "destination", phonetic: "/ˌdes.təˈneɪ.ʃən/", meaning: "điểm đến", example: "Paris is my dream destination.", difficulty: "medium" },
              { word: "departure", phonetic: "/dɪˈpɑːr.tʃɚ/", meaning: "khởi hành", example: "Our departure time is 8 a.m.", difficulty: "medium" },
              { word: "sightseeing", phonetic: "/ˈsaɪtˌsiː.ɪŋ/", meaning: "tham quan", example: "We spent the afternoon sightseeing.", difficulty: "medium" },
              { word: "itinerary", phonetic: "/aɪˈtɪn.ə.rer.i/", meaning: "lịch trình du lịch", example: "Our itinerary includes three cities.", difficulty: "hard" },
              { word: "accommodation", phonetic: "/əˌkɑː.məˈdeɪ.ʃən/", meaning: "chỗ ở", example: "We booked accommodation near the city center.", difficulty: "hard" },
              { word: "transportation", phonetic: "/ˌtræn.spɚˈteɪ.ʃən/", meaning: "phương tiện di chuyển", example: "Public transportation is convenient in Singapore.", difficulty: "hard" }
            ]
          },
          {
            id: "work",
            icon: "ti-briefcase",
            name: "Công việc",
            desc: "Văn phòng, họp hành, email và hiệu suất làm việc.",
            words: [
              { word: "job", phonetic: "/dʒɑːb/", meaning: "công việc", example: "She found a new job last month.", difficulty: "easy" },
              { word: "meeting", phonetic: "/ˈmiː.tɪŋ/", meaning: "cuộc họp", example: "The meeting starts at 9 a.m.", difficulty: "easy" },
              { word: "email", phonetic: "/ˈiː.meɪl/", meaning: "email", example: "I sent an email to my manager.", difficulty: "easy" },
              { word: "office", phonetic: "/ˈɔː.fɪs/", meaning: "văn phòng", example: "Our office is on the fifth floor.", difficulty: "easy" },
              { word: "manager", phonetic: "/ˈmæn.ɪ.dʒɚ/", meaning: "quản lý", example: "My manager is very supportive.", difficulty: "easy" },
              { word: "deadline", phonetic: "/ˈded.laɪn/", meaning: "hạn chót", example: "The project deadline is Friday.", difficulty: "medium" },
              { word: "colleague", phonetic: "/ˈkɑː.liːɡ/", meaning: "đồng nghiệp", example: "My colleague helped me finish the report.", difficulty: "medium" },
              { word: "interview", phonetic: "/ˈɪn.t̬ɚ.vjuː/", meaning: "phỏng vấn", example: "I have a job interview tomorrow.", difficulty: "medium" },
              { word: "promotion", phonetic: "/prəˈmoʊ.ʃən/", meaning: "thăng chức", example: "She got a promotion after two years.", difficulty: "medium" },
              { word: "performance review", phonetic: "/pɚˈfɔːr.məns rɪˈvjuː/", meaning: "đánh giá hiệu suất", example: "We have a performance review every quarter.", difficulty: "hard" },
              { word: "negotiation", phonetic: "/nɪˌɡoʊ.ʃiˈeɪ.ʃən/", meaning: "đàm phán", example: "The salary negotiation went well.", difficulty: "hard" },
              { word: "productivity", phonetic: "/ˌproʊ.dʌkˈtɪv.ə.t̬i/", meaning: "năng suất", example: "Music helps improve my productivity.", difficulty: "hard" }
            ]
          },
          {
            id: "health",
            icon: "ti-pulse",
            name: "Sức khỏe",
            desc: "Khám bệnh, triệu chứng và chăm sóc sức khỏe.",
            words: [
              { word: "fever", phonetic: "/ˈfiː.vɚ/", meaning: "sốt", example: "I have a fever today.", difficulty: "easy" },
              { word: "pain", phonetic: "/peɪn/", meaning: "cơn đau", example: "I feel pain in my back.", difficulty: "easy" },
              { word: "medicine", phonetic: "/ˈmed.ɪ.sən/", meaning: "thuốc", example: "Take this medicine after meals.", difficulty: "easy" },
              { word: "doctor", phonetic: "/ˈdɑːk.tɚ/", meaning: "bác sĩ", example: "The doctor checked my throat.", difficulty: "easy" },
              { word: "exercise", phonetic: "/ˈek.sɚ.saɪz/", meaning: "tập thể dục", example: "Exercise is good for your health.", difficulty: "easy" },
              { word: "symptom", phonetic: "/ˈsɪmp.təm/", meaning: "triệu chứng", example: "A cough can be a symptom of flu.", difficulty: "medium" },
              { word: "treatment", phonetic: "/ˈtriːt.mənt/", meaning: "điều trị", example: "The treatment lasted two weeks.", difficulty: "medium" },
              { word: "recovery", phonetic: "/rɪˈkʌv.ɚ.i/", meaning: "sự hồi phục", example: "Her recovery was very quick.", difficulty: "medium" },
              { word: "diet", phonetic: "/ˈdaɪ.ət/", meaning: "chế độ ăn", example: "A healthy diet helps you stay fit.", difficulty: "medium" },
              { word: "diagnosis", phonetic: "/ˌdaɪ.əɡˈnoʊ.sɪs/", meaning: "chẩn đoán", example: "The doctor gave a clear diagnosis.", difficulty: "hard" },
              { word: "prescription", phonetic: "/prɪˈskrɪp.ʃən/", meaning: "đơn thuốc", example: "You need a prescription to buy this medicine.", difficulty: "hard" },
              { word: "immunity", phonetic: "/ɪˈmjuː.nə.t̬i/", meaning: "miễn dịch", example: "Sleep helps strengthen your immunity.", difficulty: "hard" }
            ]
          },
          {
            id: "communication",
            icon: "ti-comments",
            name: "Giao tiếp",
            desc: "Trao đổi ý kiến, phản hồi, hỏi lại và xử lý hội thoại thực tế.",
            words: [
              { word: "reply", phonetic: "/rɪˈplaɪ/", meaning: "trả lời", example: "Please reply to my message.", difficulty: "easy" },
              { word: "question", phonetic: "/ˈkwes.tʃən/", meaning: "câu hỏi", example: "Can I ask a question?", difficulty: "easy" },
              { word: "agree", phonetic: "/əˈɡriː/", meaning: "đồng ý", example: "I agree with your idea.", difficulty: "easy" },
              { word: "explain", phonetic: "/ɪkˈspleɪn/", meaning: "giải thích", example: "Can you explain this sentence?", difficulty: "easy" },
              { word: "listen", phonetic: "/ˈlɪs.ən/", meaning: "lắng nghe", example: "Good speakers also listen carefully.", difficulty: "easy" },
              { word: "opinion", phonetic: "/əˈpɪn.jən/", meaning: "ý kiến", example: "What is your opinion about this topic?", difficulty: "medium" },
              { word: "interrupt", phonetic: "/ˌɪn.təˈrʌpt/", meaning: "ngắt lời", example: "Please do not interrupt the speaker.", difficulty: "medium" },
              { word: "clarify", phonetic: "/ˈkler.ə.faɪ/", meaning: "làm rõ", example: "Could you clarify your answer?", difficulty: "medium" },
              { word: "respond", phonetic: "/rɪˈspɑːnd/", meaning: "phản hồi", example: "She responded politely to the question.", difficulty: "medium" },
              { word: "persuade", phonetic: "/pərˈsweɪd/", meaning: "thuyết phục", example: "He tried to persuade me to join the club.", difficulty: "hard" },
              { word: "misunderstanding", phonetic: "/ˌmɪs.ʌn.dərˈstæn.dɪŋ/", meaning: "sự hiểu lầm", example: "The misunderstanding was solved quickly.", difficulty: "hard" },
              { word: "negotiation", phonetic: "/nɪˌɡoʊ.ʃiˈeɪ.ʃən/", meaning: "sự thương lượng", example: "Negotiation skills are useful at work.", difficulty: "hard" }
            ]
          },
          {
            id: "money",
            icon: "ti-wallet",
            name: "Tiền bạc",
            desc: "Chi tiêu, tiết kiệm, thanh toán và quản lý tài chính cá nhân.",
            words: [
              { word: "money", phonetic: "/ˈmʌn.i/", meaning: "tiền", example: "I need some money for lunch.", difficulty: "easy" },
              { word: "bank", phonetic: "/bæŋk/", meaning: "ngân hàng", example: "I went to the bank yesterday.", difficulty: "easy" },
              { word: "cash", phonetic: "/kæʃ/", meaning: "tiền mặt", example: "I paid in cash.", difficulty: "easy" },
              { word: "bill", phonetic: "/bɪl/", meaning: "hóa đơn", example: "The electricity bill is high.", difficulty: "easy" },
              { word: "price", phonetic: "/praɪs/", meaning: "giá", example: "The price is reasonable.", difficulty: "easy" },
              { word: "budget", phonetic: "/ˈbʌdʒ.ɪt/", meaning: "ngân sách", example: "I have a small monthly budget.", difficulty: "medium" },
              { word: "saving", phonetic: "/ˈseɪ.vɪŋ/", meaning: "tiền tiết kiệm", example: "Saving money is important.", difficulty: "medium" },
              { word: "expense", phonetic: "/ɪkˈspens/", meaning: "chi phí", example: "Rent is my biggest monthly expense.", difficulty: "medium" },
              { word: "transfer", phonetic: "/trænsˈfɝː/", meaning: "chuyển khoản", example: "I will transfer the money tonight.", difficulty: "medium" },
              { word: "interest rate", phonetic: "/ˈɪn.trəst reɪt/", meaning: "lãi suất", example: "The interest rate changed this month.", difficulty: "hard" },
              { word: "financial literacy", phonetic: "/faɪˈnæn.ʃəl ˈlɪt̬.ər.ə.si/", meaning: "kiến thức tài chính", example: "Financial literacy helps people manage money better.", difficulty: "hard" },
              { word: "installment", phonetic: "/ɪnˈstɔːl.mənt/", meaning: "khoản trả góp", example: "He bought the phone by installment.", difficulty: "hard" }
            ]
          },
          {
            id: "environment",
            icon: "ti-world",
            name: "Môi trường",
            desc: "Rác thải, ô nhiễm, tái chế và bảo vệ thiên nhiên.",
            words: [
              { word: "tree", phonetic: "/triː/", meaning: "cây", example: "We planted a tree near the school.", difficulty: "easy" },
              { word: "river", phonetic: "/ˈrɪv.ər/", meaning: "dòng sông", example: "The river is clean.", difficulty: "easy" },
              { word: "trash", phonetic: "/træʃ/", meaning: "rác", example: "Please put trash in the bin.", difficulty: "easy" },
              { word: "clean", phonetic: "/kliːn/", meaning: "sạch", example: "We should keep the classroom clean.", difficulty: "easy" },
              { word: "nature", phonetic: "/ˈneɪ.tʃər/", meaning: "thiên nhiên", example: "I enjoy spending time in nature.", difficulty: "easy" },
              { word: "pollution", phonetic: "/pəˈluː.ʃən/", meaning: "ô nhiễm", example: "Air pollution is a serious problem.", difficulty: "medium" },
              { word: "recycle", phonetic: "/ˌriːˈsaɪ.kəl/", meaning: "tái chế", example: "We should recycle plastic bottles.", difficulty: "medium" },
              { word: "waste", phonetic: "/weɪst/", meaning: "chất thải", example: "Factories produce a lot of waste.", difficulty: "medium" },
              { word: "protect", phonetic: "/prəˈtekt/", meaning: "bảo vệ", example: "We need to protect the environment.", difficulty: "medium" },
              { word: "sustainability", phonetic: "/səˌsteɪ.nəˈbɪl.ə.ti/", meaning: "tính bền vững", example: "Sustainability is important for future generations.", difficulty: "hard" },
              { word: "biodiversity", phonetic: "/ˌbaɪ.oʊ.daɪˈvɝː.sə.ti/", meaning: "đa dạng sinh học", example: "Forests support biodiversity.", difficulty: "hard" },
              { word: "conservation", phonetic: "/ˌkɑːn.sərˈveɪ.ʃən/", meaning: "sự bảo tồn", example: "Wildlife conservation protects endangered animals.", difficulty: "hard" }
            ]
          },
          {
            id: "culture",
            icon: "ti-flag-alt",
            name: "Văn hóa",
            desc: "Phong tục, lễ hội, truyền thống và khác biệt văn hóa.",
            words: [
              { word: "festival", phonetic: "/ˈfes.tə.vəl/", meaning: "lễ hội", example: "Tet is an important festival in Vietnam.", difficulty: "easy" },
              { word: "holiday", phonetic: "/ˈhɑː.lə.deɪ/", meaning: "ngày lễ", example: "We visit family during the holiday.", difficulty: "easy" },
              { word: "custom", phonetic: "/ˈkʌs.təm/", meaning: "phong tục", example: "Every country has different customs.", difficulty: "easy" },
              { word: "food", phonetic: "/fuːd/", meaning: "món ăn", example: "Food is an important part of culture.", difficulty: "easy" },
              { word: "music", phonetic: "/ˈmjuː.zɪk/", meaning: "âm nhạc", example: "Traditional music sounds beautiful.", difficulty: "easy" },
              { word: "tradition", phonetic: "/trəˈdɪʃ.ən/", meaning: "truyền thống", example: "This tradition is very old.", difficulty: "medium" },
              { word: "identity", phonetic: "/aɪˈden.tə.ti/", meaning: "bản sắc", example: "Language is part of cultural identity.", difficulty: "medium" },
              { word: "ceremony", phonetic: "/ˈser.ə.moʊ.ni/", meaning: "nghi lễ", example: "The wedding ceremony was simple.", difficulty: "medium" },
              { word: "heritage", phonetic: "/ˈher.ɪ.tɪdʒ/", meaning: "di sản", example: "Hoi An is a cultural heritage site.", difficulty: "medium" },
              { word: "cross-cultural", phonetic: "/ˌkrɔːs ˈkʌl.tʃər.əl/", meaning: "liên văn hóa", example: "Cross-cultural communication is useful in business.", difficulty: "hard" },
              { word: "assimilation", phonetic: "/əˌsɪm.əˈleɪ.ʃən/", meaning: "sự đồng hóa", example: "Assimilation can change local traditions.", difficulty: "hard" },
              { word: "cultural nuance", phonetic: "/ˈkʌl.tʃər.əl ˈnuː.ɑːns/", meaning: "sắc thái văn hóa", example: "Understanding cultural nuance prevents mistakes.", difficulty: "hard" }
            ]
          }
        ]
      },

      hard: {
        title: "Hard Vocabulary",
        subtitle: "Nhóm từ nâng cao cho công nghệ, kinh doanh và học thuật.",
        label: "Chuyên sâu",
        topics: [
          {
            id: "technology",
            icon: "ti-desktop",
            name: "Công nghệ",
            desc: "Thiết bị số, hệ thống, dữ liệu và bảo mật.",
            words: [
              { word: "device", phonetic: "/dɪˈvaɪs/", meaning: "thiết bị", example: "This device is easy to use.", difficulty: "easy" },
              { word: "screen", phonetic: "/skriːn/", meaning: "màn hình", example: "The screen is very bright.", difficulty: "easy" },
              { word: "app", phonetic: "/æp/", meaning: "ứng dụng", example: "I use a language app every day.", difficulty: "easy" },
              { word: "password", phonetic: "/ˈpæs.wɝːd/", meaning: "mật khẩu", example: "Do not share your password with anyone.", difficulty: "easy" },
              { word: "file", phonetic: "/faɪl/", meaning: "tệp", example: "Please send me the file.", difficulty: "easy" },
              { word: "software", phonetic: "/ˈsɑːft.wer/", meaning: "phần mềm", example: "This software helps students learn faster.", difficulty: "medium" },
              { word: "database", phonetic: "/ˈdeɪ.tə.beɪs/", meaning: "cơ sở dữ liệu", example: "The website stores user information in a database.", difficulty: "medium" },
              { word: "interface", phonetic: "/ˈɪn.t̬ɚ.feɪs/", meaning: "giao diện", example: "The interface looks simple and modern.", difficulty: "medium" },
              { word: "network", phonetic: "/ˈnet.wɝːk/", meaning: "mạng", example: "The office network is very stable.", difficulty: "medium" },
              { word: "algorithm", phonetic: "/ˈæl.ɡə.rɪ.ðəm/", meaning: "thuật toán", example: "The algorithm suggests personalized lessons.", difficulty: "hard" },
              { word: "authentication", phonetic: "/ɔːˌθen.təˈkeɪ.ʃən/", meaning: "xác thực", example: "Two-factor authentication improves security.", difficulty: "hard" },
              { word: "scalability", phonetic: "/ˌskeɪ.ləˈbɪl.ə.ti/", meaning: "khả năng mở rộng", example: "Scalability matters for large websites.", difficulty: "hard" }
            ]
          },
          {
            id: "business",
            icon: "ti-stats-up",
            name: "Kinh doanh",
            desc: "Khách hàng, doanh thu, chiến lược và thị trường.",
            words: [
              { word: "customer", phonetic: "/ˈkʌs.tə.mɚ/", meaning: "khách hàng", example: "The customer asked for support.", difficulty: "easy" },
              { word: "price", phonetic: "/praɪs/", meaning: "giá", example: "The price is reasonable.", difficulty: "easy" },
              { word: "sale", phonetic: "/seɪl/", meaning: "bán hàng", example: "The store has a big sale this week.", difficulty: "easy" },
              { word: "market", phonetic: "/ˈmɑːr.kɪt/", meaning: "thị trường", example: "The local market is very crowded.", difficulty: "easy" },
              { word: "profit", phonetic: "/ˈprɑː.fɪt/", meaning: "lợi nhuận", example: "The company made a good profit last year.", difficulty: "easy" },
              { word: "revenue", phonetic: "/ˈrev.ə.nuː/", meaning: "doanh thu", example: "Online courses increased the company’s revenue.", difficulty: "medium" },
              { word: "strategy", phonetic: "/ˈstræt̬.ə.dʒi/", meaning: "chiến lược", example: "We need a better marketing strategy.", difficulty: "medium" },
              { word: "investment", phonetic: "/ɪnˈvest.mənt/", meaning: "đầu tư", example: "Education is a good investment.", difficulty: "medium" },
              { word: "branding", phonetic: "/ˈbræn.dɪŋ/", meaning: "xây dựng thương hiệu", example: "Branding helps companies stand out.", difficulty: "medium" },
              { word: "competitive advantage", phonetic: "/kəmˈpet̬.ə.t̬ɪv ədˈvæn.t̬ɪdʒ/", meaning: "lợi thế cạnh tranh", example: "Fast service is our competitive advantage.", difficulty: "hard" },
              { word: "market segmentation", phonetic: "/ˈmɑːr.kɪt ˌseɡ.menˈteɪ.ʃən/", meaning: "phân khúc thị trường", example: "Market segmentation helps target the right customers.", difficulty: "hard" },
              { word: "stakeholder", phonetic: "/ˈsteɪkˌhoʊl.dɚ/", meaning: "bên liên quan", example: "All stakeholders attended the meeting.", difficulty: "hard" }
            ]
          },
          {
            id: "academic",
            icon: "ti-pencil-alt",
            name: "Học thuật / IELTS",
            desc: "Bài luận, nghiên cứu và cách diễn đạt nâng cao.",
            words: [
              { word: "topic", phonetic: "/ˈtɑː.pɪk/", meaning: "chủ đề", example: "The essay topic is education.", difficulty: "easy" },
              { word: "example", phonetic: "/ɪɡˈzæm.pəl/", meaning: "ví dụ", example: "Please give one clear example.", difficulty: "easy" },
              { word: "idea", phonetic: "/aɪˈdiː.ə/", meaning: "ý tưởng", example: "That is a useful idea for the essay.", difficulty: "easy" },
              { word: "chart", phonetic: "/tʃɑːrt/", meaning: "biểu đồ", example: "The chart shows population growth.", difficulty: "easy" },
              { word: "result", phonetic: "/rɪˈzʌlt/", meaning: "kết quả", example: "The result was better than expected.", difficulty: "easy" },
              { word: "evidence", phonetic: "/ˈev.ə.dəns/", meaning: "bằng chứng", example: "Your argument needs stronger evidence.", difficulty: "medium" },
              { word: "significant", phonetic: "/sɪɡˈnɪf.ə.kənt/", meaning: "đáng kể", example: "There was a significant increase in sales.", difficulty: "medium" },
              { word: "analysis", phonetic: "/əˈnæl.ə.sɪs/", meaning: "phân tích", example: "The report includes detailed analysis.", difficulty: "medium" },
              { word: "argument", phonetic: "/ˈɑːr.ɡjə.mənt/", meaning: "lập luận", example: "Her argument is clear and convincing.", difficulty: "medium" },
              { word: "hypothesis", phonetic: "/haɪˈpɑː.θə.sɪs/", meaning: "giả thuyết", example: "The hypothesis needs further testing.", difficulty: "hard" },
              { word: "counterargument", phonetic: "/ˈkaʊn.t̬ɚˌɑːrɡ.jə.mənt/", meaning: "lập luận phản biện", example: "A strong essay should address the counterargument.", difficulty: "hard" },
              { word: "methodology", phonetic: "/ˌmeθ.əˈdɑː.lə.dʒi/", meaning: "phương pháp nghiên cứu", example: "The methodology section explains how the study was conducted.", difficulty: "hard" }
            ]
          },
          {
            id: "science",
            icon: "ti-light-bulb",
            name: "Khoa học",
            desc: "Thí nghiệm, nghiên cứu, phát hiện và thuật ngữ khoa học phổ biến.",
            words: [
              { word: "energy", phonetic: "/ˈen.ər.dʒi/", meaning: "năng lượng", example: "Solar energy is clean.", difficulty: "easy" },
              { word: "planet", phonetic: "/ˈplæn.ɪt/", meaning: "hành tinh", example: "Earth is a planet.", difficulty: "easy" },
              { word: "water", phonetic: "/ˈwɑː.t̬ər/", meaning: "nước", example: "Water is necessary for life.", difficulty: "easy" },
              { word: "light", phonetic: "/laɪt/", meaning: "ánh sáng", example: "Plants need light to grow.", difficulty: "easy" },
              { word: "animal", phonetic: "/ˈæn.ə.məl/", meaning: "động vật", example: "The animal lives in the forest.", difficulty: "easy" },
              { word: "experiment", phonetic: "/ɪkˈsper.ə.mənt/", meaning: "thí nghiệm", example: "The experiment was successful.", difficulty: "medium" },
              { word: "observation", phonetic: "/ˌɑːb.zərˈveɪ.ʃən/", meaning: "sự quan sát", example: "Careful observation is important in science.", difficulty: "medium" },
              { word: "research", phonetic: "/ˈriː.sɝːtʃ/", meaning: "nghiên cứu", example: "The research took two years.", difficulty: "medium" },
              { word: "theory", phonetic: "/ˈθɪr.i/", meaning: "lý thuyết", example: "This theory explains the result.", difficulty: "medium" },
              { word: "phenomenon", phonetic: "/fəˈnɑː.mə.nɑːn/", meaning: "hiện tượng", example: "This natural phenomenon is rare.", difficulty: "hard" },
              { word: "empirical", phonetic: "/ɪmˈpɪr.ɪ.kəl/", meaning: "dựa trên thực nghiệm", example: "The theory needs empirical evidence.", difficulty: "hard" },
              { word: "molecular", phonetic: "/məˈlek.jə.lər/", meaning: "thuộc phân tử", example: "Molecular structure affects chemical behavior.", difficulty: "hard" }
            ]
          },
          {
            id: "law",
            icon: "ti-ink-pen",
            name: "Luật pháp",
            desc: "Quy định, quyền lợi, trách nhiệm và văn bản pháp lý.",
            words: [
              { word: "rule", phonetic: "/ruːl/", meaning: "quy tắc", example: "Every class has rules.", difficulty: "easy" },
              { word: "right", phonetic: "/raɪt/", meaning: "quyền", example: "Everyone has the right to learn.", difficulty: "easy" },
              { word: "law", phonetic: "/lɔː/", meaning: "luật", example: "The law protects children.", difficulty: "easy" },
              { word: "court", phonetic: "/kɔːrt/", meaning: "tòa án", example: "The case went to court.", difficulty: "easy" },
              { word: "judge", phonetic: "/dʒʌdʒ/", meaning: "thẩm phán", example: "The judge listened carefully.", difficulty: "easy" },
              { word: "contract", phonetic: "/ˈkɑːn.trækt/", meaning: "hợp đồng", example: "Read the contract carefully.", difficulty: "medium" },
              { word: "regulation", phonetic: "/ˌreɡ.jəˈleɪ.ʃən/", meaning: "quy định", example: "Companies must follow safety regulations.", difficulty: "medium" },
              { word: "evidence", phonetic: "/ˈev.ə.dəns/", meaning: "bằng chứng", example: "The lawyer presented evidence.", difficulty: "medium" },
              { word: "legal", phonetic: "/ˈliː.ɡəl/", meaning: "hợp pháp", example: "You should get legal advice.", difficulty: "medium" },
              { word: "liability", phonetic: "/ˌlaɪ.əˈbɪl.ə.ti/", meaning: "trách nhiệm pháp lý", example: "The company accepted liability for the mistake.", difficulty: "hard" },
              { word: "jurisdiction", phonetic: "/ˌdʒʊr.ɪsˈdɪk.ʃən/", meaning: "thẩm quyền pháp lý", example: "The case is outside this court's jurisdiction.", difficulty: "hard" },
              { word: "compliance", phonetic: "/kəmˈplaɪ.əns/", meaning: "sự tuân thủ", example: "Compliance with the law is required.", difficulty: "hard" }
            ]
          },
          {
            id: "psychology",
            icon: "ti-user",
            name: "Tâm lý học",
            desc: "Cảm xúc, hành vi, động lực và tư duy con người.",
            words: [
              { word: "feeling", phonetic: "/ˈfiː.lɪŋ/", meaning: "cảm xúc", example: "I have a good feeling today.", difficulty: "easy" },
              { word: "stress", phonetic: "/stres/", meaning: "căng thẳng", example: "Too much work causes stress.", difficulty: "easy" },
              { word: "mind", phonetic: "/maɪnd/", meaning: "tâm trí", example: "A calm mind helps you study better.", difficulty: "easy" },
              { word: "habit", phonetic: "/ˈhæb.ɪt/", meaning: "thói quen", example: "Reading is a useful habit.", difficulty: "easy" },
              { word: "fear", phonetic: "/fɪr/", meaning: "nỗi sợ", example: "Fear can stop people from trying.", difficulty: "easy" },
              { word: "behavior", phonetic: "/bɪˈheɪ.vjər/", meaning: "hành vi", example: "His behavior changed recently.", difficulty: "medium" },
              { word: "motivation", phonetic: "/ˌmoʊ.t̬əˈveɪ.ʃən/", meaning: "động lực", example: "Motivation helps students study every day.", difficulty: "medium" },
              { word: "emotion", phonetic: "/ɪˈmoʊ.ʃən/", meaning: "cảm xúc", example: "Music can affect emotion.", difficulty: "medium" },
              { word: "memory", phonetic: "/ˈmem.ər.i/", meaning: "trí nhớ", example: "Sleep improves memory.", difficulty: "medium" },
              { word: "cognitive", phonetic: "/ˈkɑːɡ.nə.t̬ɪv/", meaning: "thuộc nhận thức", example: "Reading improves cognitive skills.", difficulty: "hard" },
              { word: "subconscious", phonetic: "/ˌsʌbˈkɑːn.ʃəs/", meaning: "tiềm thức", example: "Some habits come from the subconscious mind.", difficulty: "hard" },
              { word: "resilience", phonetic: "/rɪˈzɪl.jəns/", meaning: "khả năng phục hồi tinh thần", example: "Resilience helps people overcome failure.", difficulty: "hard" }
            ]
          },
          {
            id: "media",
            icon: "ti-video-camera",
            name: "Truyền thông",
            desc: "Báo chí, mạng xã hội, quảng cáo và nội dung số.",
            words: [
              { word: "video", phonetic: "/ˈvɪd.i.oʊ/", meaning: "video", example: "I watched an English video.", difficulty: "easy" },
              { word: "post", phonetic: "/poʊst/", meaning: "bài đăng", example: "She wrote a post about learning.", difficulty: "easy" },
              { word: "news", phonetic: "/nuːz/", meaning: "tin tức", example: "I read the news every morning.", difficulty: "easy" },
              { word: "photo", phonetic: "/ˈfoʊ.t̬oʊ/", meaning: "ảnh", example: "He uploaded a photo.", difficulty: "easy" },
              { word: "share", phonetic: "/ʃer/", meaning: "chia sẻ", example: "Please share this article.", difficulty: "easy" },
              { word: "audience", phonetic: "/ˈɑː.di.əns/", meaning: "khán giả", example: "The audience enjoyed the talk.", difficulty: "medium" },
              { word: "content", phonetic: "/ˈkɑːn.tent/", meaning: "nội dung", example: "Good content keeps users interested.", difficulty: "medium" },
              { word: "headline", phonetic: "/ˈhed.laɪn/", meaning: "tiêu đề tin", example: "The headline caught my attention.", difficulty: "medium" },
              { word: "source", phonetic: "/sɔːrs/", meaning: "nguồn tin", example: "Check the source before sharing news.", difficulty: "medium" },
              { word: "engagement", phonetic: "/ɪnˈɡeɪdʒ.mənt/", meaning: "mức độ tương tác", example: "The post received high engagement.", difficulty: "hard" },
              { word: "narrative", phonetic: "/ˈner.ə.t̬ɪv/", meaning: "câu chuyện, lối kể", example: "The brand needs a stronger narrative.", difficulty: "hard" },
              { word: "misinformation", phonetic: "/ˌmɪs.ɪn.fərˈmeɪ.ʃən/", meaning: "thông tin sai lệch", example: "Misinformation spreads quickly online.", difficulty: "hard" }
            ]
          }
        ]
      }
    };
