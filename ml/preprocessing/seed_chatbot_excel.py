"""
seed_chatbot_excel.py
----------------------
Creates the STARTING chatbot Q&A workbook at data/raw/chatbot_qna.xlsx.

Run this ONCE to generate the first version of the file. After that, Dishari
edits the .xlsx directly (Excel / Google Sheets / LibreOffice) — adding,
changing or deleting rows — and re-runs build_chatbot_data.py to push those
edits into the live site. Running this seed script again would overwrite any
manual edits, so it is not part of the normal update workflow.

Columns (this exact header row is what build_chatbot_data.py expects):
  id        - short unique code, e.g. FAQ001 (not shown to users, just for
              tracking / editing individual rows easily)
  category  - free-text grouping, only used for organising the sheet
  question  - the CANONICAL way of asking this (the engine fuzzy-matches
              other phrasings, typos and word order against this + keywords,
              so you do NOT need one row per phrasing)
  keywords  - comma-separated extra trigger words / synonyms that should
              also point at this answer (helps short queries, slang, etc.)
  answer    - what the chatbot replies with
"""

import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # .../VOYEXAAI
OUT_PATH = ROOT / "data" / "raw" / "chatbot_qna.xlsx"

rows = []


def add(category, question, keywords, answer):
    rows.append(
        {
            "id": f"FAQ{len(rows) + 1:03d}",
            "category": category,
            "question": question,
            "keywords": keywords,
            "answer": answer,
        }
    )


# ---------------------------------------------------------------- greetings
add("greeting", "hi", "hi,hii,hiii,yo,hola",
    "Hey! I'm the Voyexa assistant. Ask me about a place, a state, or how the site works.")
add("greeting", "hello", "hello,helo,hllo",
    "Hello! Happy to help — ask me about destinations, budgets, or how to use Voyexa.")
add("greeting", "hey there", "hey,heya,sup,whats up",
    "Hey there! What are you planning — a specific place, or just browsing ideas?")
add("greeting", "good morning", "gm,good morning,morning",
    "Good morning! Ready to plan a trip, or just exploring what's here?")
add("greeting", "good evening", "good evening,gn,good night",
    "Good evening! Let me know if you want place suggestions or help using the site.")
add("small_talk", "how are you", "how are you,how r u,hows it going,how are u doing",
    "Doing well, thanks for asking! How can I help with your trip planning?")
add("small_talk", "what is your name", "your name,who are you,what should i call you",
    "I'm the Voyexa assistant — a built-in helper for this site, not a general chatbot.")
add("small_talk", "are you a real person", "are you human,are you a bot,are you ai,are you real",
    "I'm a rule-based assistant built specifically for Voyexa — not a live person, and not a "
    "general-purpose AI like ChatGPT. I only know about this website and its travel data.")
add("small_talk", "what can you do", "what can you help with,capabilities,what do you know",
    "I can tell you about places and states in the catalogue, explain how Voyexa's "
    "recommendations work, and walk you through using the site — planning a trip, "
    "wishlisting places, exporting your itinerary, and more.")
add("small_talk", "tell me a joke", "joke,funny,make me laugh",
    "Why did the traveller bring a ladder to Voyexa? To reach the hidden gems! "
    "...I'll stick to travel tips from here.")
add("small_talk", "who made voyexa", "who built this,who created voyexa,who developed this site,developer",
    "Voyexa AI was built as an academic project combining a places dataset, a few ML "
    "models (popularity, hidden-gem detection, similarity, geo-clustering) and a React "
    "front end.")

# ---------------------------------------------------------- farewell/thanks
add("farewell", "thank you", "thanks,thnx,thx,ty,thank u,tysm",
    "You're welcome! Ask me anything else about your trip.")
add("farewell", "bye", "bye,goodbye,see you,cya,gtg",
    "Bye! Come back anytime you want more place ideas or help with the site.")
add("farewell", "that was helpful", "that helped,great answer,nice thanks,perfect thanks",
    "Glad it helped! Feel free to ask more, or drop a note in the feedback section on "
    "the home page if there's anything we should add.")
add("farewell", "you are not helpful", "not helpful,useless,you dont understand,bad bot",
    "Sorry about that — I only know about Voyexa and its place data, so very open-ended "
    "questions can stump me. Please use the feedback form on the home page to tell us "
    "what you were looking for, so we can teach me the answer.")

# --------------------------------------------------------- about the platform
add("about_platform", "what is voyexa", "voyexa,what is voyexa ai,about voyexa,what is this site,what is this website",
    "Voyexa AI is a trip-planning site for India: browse a catalogue of real places, "
    "filter by zone/state/interest, and get a ranked, day-by-day itinerary built from "
    "your budget, group and interests.")
add("about_platform", "is voyexa free to use", "free,is it free,cost to use,paid,subscription",
    "Yes — browsing places, planning a trip and exporting your itinerary are all free.")
add("about_platform", "what is ai", "what is ai,define ai,meaning of ai,ai meaning,explain ai",
    "AI (artificial intelligence) here means software that learns patterns from data to "
    "make predictions — on Voyexa, that's models predicting a place's popularity, "
    "whether it's a hidden gem, and which places suit your interests, rather than a "
    "human manually ranking every place.")
add("about_platform", "why is it called ai", "why ai,is this really ai,is this actual ai,rule based or ai",
    "Voyexa's recommendation and ranking side is genuinely model-based (see the ml/ "
    "notebooks — popularity regression, a hidden-gem classifier, a similarity "
    "recommender, and geo-clustering for itineraries). This chatbot specifically, "
    "though, is a lightweight rule/keyword matcher over a curated question bank, not a "
    "general AI model — that's a deliberate choice, explained below.")
add("about_platform", "why doesnt the chatbot use chatgpt or gemini", "why no gemini,why no chatgpt,no llm,no external api,why no grok",
    "This assistant intentionally does not call an external AI like Gemini, GPT or Grok. "
    "Those would give generic, internet-wide answers instead of answers grounded in "
    "Voyexa's own data and features — and they'd need an internet call and an API key "
    "for every message. Instead, everything here is matched against Voyexa's own "
    "question bank and its own places dataset, so answers always stay on-topic.")
add("about_platform", "how does the recommendation work", "how do you recommend places,how does ranking work,how are places ranked,recommendation engine",
    "Each place is scored on a few things: how well its interest tags match what you "
    "picked, a learned popularity score, a hidden-gem score for lesser-known spots, and "
    "how well it fits your budget and group. Those scores are blended together to rank "
    "the shortlist, and nearby picks are grouped geographically into a day-by-day plan.")
add("about_platform", "what is a hidden gem", "hidden gem,hidden gems,what does hidden gem mean,hidden gem score",
    "A hidden gem is a place with strong signals for a great trip (interest match, "
    "condition, uniqueness) but a lower popularity/review count — genuinely worth "
    "visiting but less crowded than the big-name spots. You can filter for these on "
    "the Explore page.")
add("about_platform", "what is popularity rating", "popularity rating,popularity score,what does the rating mean",
    "It's a 0–5 style score reflecting how well-known and consistently well-reviewed a "
    "place is, based on review counts and ratings in the underlying dataset.")
add("about_platform", "what are zones", "zones,what is a zone,north zone,south zone,how many zones",
    "Voyexa groups places into 6 geographic zones across India (North, South, East, "
    "West, Central and Northeast) so you can browse or filter by region on the "
    "Explore page.")
add("about_platform", "what is difficulty level", "difficulty level,easy moderate difficult,how hard is a trip",
    "Difficulty level is a rough physical-effort rating for visiting a place — Easy, "
    "Moderate or Difficult — useful for judging fitness, terrain and travel time, "
    "especially for elderly travellers or young children.")
add("about_platform", "what are interest tags", "interest tags,tags,what are tags,interests list",
    "Interest tags describe what a place is good for — things like Adventure, "
    "Wildlife, Heritage, Beach, Spiritual, Nightlife and dozens more. You pick the "
    "ones you care about in the planner, and matching places get ranked higher.")
add("about_platform", "what does suitable for mean", "suitable for,who is it suitable for,suitable for family,suitable for solo",
    "Suitable For lists the kinds of travellers a place works well for — Solo, "
    "Couples, Family, Friends, Students, Pilgrims and more. The planner uses this to "
    "avoid suggesting, say, a rugged trek for a trip with elderly travellers.")
add("about_platform", "is my data safe", "is my data safe,privacy,data privacy,is this secure",
    "Right now Voyexa is in its frontend-only phase — your profile, wishlist and trip "
    "are stored locally in your own browser (localStorage), not sent to a server. "
    "That will change once the real backend and accounts go live.")
add("about_platform", "how many places are in the catalogue", "how many places,total places,how big is the database,number of places",
    "There are just over a thousand real places across 36 states and union "
    "territories in the catalogue — you can see the live count on the home page.")
add("about_platform", "how many states are covered", "how many states,which states,states covered,states list",
    "Voyexa currently covers 36 states and union territories across India.")

# --------------------------------------------------------------- site usage
add("site_usage", "how do i plan a trip", "plan a trip,how to plan,start planning,create itinerary",
    "Click \"Plan my trip\" on the home page, then answer a few quick steps — who it's "
    "for, group type, budget/month/days, and your interests. Voyexa ranks matching "
    "places and builds a day-by-day plan from them.")
add("site_usage", "how do i explore places", "explore places,browse places,how to search places,find places",
    "Go to the Explore page — you can search by name/city/state, or filter by zone, "
    "state, interest, and hidden-gems-only.")
add("site_usage", "how do i filter by state", "filter by state,search by state,state filter",
    "On the Explore page, use the State dropdown filter to narrow the list to one "
    "state — or just ask me about a state directly, e.g. \"places in Kerala\".")
add("site_usage", "how do i save a place for later", "wishlist,save for later,how to wishlist,add to wishlist",
    "Tap the wishlist/heart icon on any place card or its detail page. Wishlisted "
    "places are saved in your browser so you can come back to them later.")
add("site_usage", "how do i add a place to my trip", "add to trip,how to add to trip,put in trip",
    "From a place card or its detail page, add it to your current trip — this is the "
    "shortlist that actually goes into your itinerary, separate from your wishlist.")
add("site_usage", "how do i remove a place from my trip", "remove from trip,delete from trip,take out of trip",
    "Open your trip bar and remove the place from there — it comes straight back out "
    "of your itinerary plan.")
add("site_usage", "how do i see my itinerary", "view itinerary,see my plan,my itinerary",
    "After planning, go to the Itinerary page — it shows your places grouped into a "
    "day-by-day schedule based on location and your chosen number of days.")
add("site_usage", "how do i download my itinerary", "download pdf,export itinerary,save itinerary as pdf,print itinerary",
    "On the Itinerary or Confirmation page, use the download/export option to get a "
    "PDF copy of your day-by-day plan.")
add("site_usage", "how do i sign up", "sign up,create account,register,new account",
    "Use the Signup page — enter your name, email, phone and date of birth to create "
    "a profile.")
add("site_usage", "how do i log in", "log in,login,sign in",
    "Use the Login page with the email you signed up with.")
add("site_usage", "i forgot my password", "forgot password,reset password,cant log in,password reset",
    "Voyexa is currently in its frontend-only phase without real backend accounts, so "
    "there's no password reset yet — logging in again with the same email restores "
    "your saved profile. A full account system is planned for later.")
add("site_usage", "how do i edit my profile", "edit profile,update profile,change my details,change name",
    "Go to the Profile page to update your name, phone number or date of birth.")
add("site_usage", "how do i switch to dark mode", "dark mode,light mode,theme,switch theme,night mode",
    "Use the theme toggle in the header to switch between light and dark mode.")
add("site_usage", "what is the admin page for", "admin page,what is admin,admin panel",
    "The Admin page is for managing place images behind the scenes — it's not a "
    "traveller-facing feature.")
add("site_usage", "how do i give feedback", "give feedback,leave feedback,feedback form,submit feedback",
    "Scroll to the Feedback section on the home page — rate your experience and leave "
    "a message. It's saved so the team can review it and improve the site.")
add("site_usage", "how do i contact support", "contact support,customer support,help desk,report a problem",
    "The best way right now is the feedback section on the home page — describe the "
    "issue there and it'll be reviewed.")
add("site_usage", "i found a bug", "bug,found a bug,something is broken,error on site,not working",
    "Sorry about that! Please use the feedback section on the home page and describe "
    "exactly what happened — that gets logged for the team to fix.")
add("site_usage", "is there a mobile app", "mobile app,app for phone,ios app,android app",
    "Not yet — Voyexa is currently a responsive website you can use from your phone's "
    "browser; a dedicated app isn't available.")
add("site_usage", "how do i clear my trip", "clear trip,reset trip,start over,remove all places",
    "Your trip planner has a clear/reset option that empties your current shortlist "
    "without touching your saved wishlist.")
add("site_usage", "what is the difference between wishlist and trip", "wishlist vs trip,difference wishlist trip,wishlist and trip",
    "Wishlist is your long-term \"save for later\" list — you can keep as many places "
    "there as you like. Trip is the short list you're actually planning to visit right "
    "now, which feeds into your itinerary.")

# ----------------------------------------------------------- travel general
add("travel_general", "what is the best time to visit india", "best time to visit,best season,when to travel india,best month",
    "It varies a lot by region — hill stations and the north are best avoided in "
    "peak monsoon, while the coasts and deserts are best outside peak summer heat. "
    "Each place page shows its own best months (Best_Month range), and the planner "
    "uses this automatically when you pick a travel month.")
add("travel_general", "how do i travel on a budget", "budget travel,cheap trip,travel on a budget,low budget trip",
    "Set a lower daily budget in the planner — it filters out places whose entry "
    "fee, activity, hotel and food costs push past what you set, so you only see "
    "options that actually fit.")
add("travel_general", "what are good family friendly places", "family friendly,places for family,good for kids,family trip",
    "Filter Explore by the \"Family\" suitability, or select \"Family\" as your group "
    "type in the planner — it'll favour places tagged safe and enjoyable for kids and "
    "the whole family.")
add("travel_general", "what are good places for adventure", "adventure places,adventure travel,trekking,adrenaline",
    "Look for the Adventure interest tag on Explore, or pick Adventure as an interest "
    "in the planner — trekking, rafting, paragliding and similar activity-heavy spots "
    "will rank higher.")
add("travel_general", "what are good romantic places", "romantic places,couple trip,honeymoon spot,places for couples",
    "Filter by \"Couples\" suitability, or the Romantic interest tag — scenic, quieter "
    "spots tend to rank well for this.")
add("travel_general", "what are good solo travel places", "solo travel,places for solo travellers,travelling alone",
    "Filter Explore by \"Solo\" suitability — these are places flagged as comfortable "
    "and worthwhile for a traveller on their own.")
add("travel_general", "what are good spiritual places", "spiritual places,pilgrimage places,religious places,temples to visit",
    "Use the Spiritual or Pilgrimage interest tags on Explore, or filter suitability "
    "by \"Pilgrims\" — temples, monasteries and other religious sites will surface.")
add("travel_general", "what are good beach destinations", "beach destinations,best beaches,beach places,coastal places",
    "Use the Beach or Coastal interest tags on Explore — Goa, the Andaman/Lakshadweep "
    "islands and several coastal states have strong options.")
add("travel_general", "what are good hill stations", "hill stations,mountain places,cool weather places,hilly places",
    "Filter by the Hills interest tag, or browse states like Himachal Pradesh, "
    "Uttarakhand or the Northeast for classic hill-station picks.")
add("travel_general", "what are good wildlife destinations", "wildlife,safari,tiger reserve,wildlife sanctuary",
    "Use the Wildlife or Tiger Reserve interest tags on Explore to find safaris and "
    "sanctuaries.")
add("travel_general", "is it safe to travel during monsoon", "monsoon travel,rainy season travel,travel in rain",
    "Some places (backwaters, tea gardens, waterfalls) actually look their best in "
    "monsoon, while hilly or landslide-prone terrain can be riskier — check each "
    "place's best-months range and terrain type before booking a monsoon trip.")
add("travel_general", "what should i pack for a trip", "what to pack,packing list,packing tips",
    "It depends heavily on the terrain and season of the place — check the place's "
    "Terrain_Type and best-months, and pack for that specific climate rather than a "
    "generic list.")
add("travel_general", "how many days do i need", "how many days,trip duration,how long should i stay",
    "Each place has a Typical_Duration (like a half-day or full-day visit) — the "
    "planner adds these up across your selected places to suggest a realistic number "
    "of days, which you can also set yourself.")
add("travel_general", "what does typical duration mean", "typical duration,how long to visit,time needed at a place",
    "It's a rough estimate of how long a visit to that specific place usually takes "
    "— a few hours, half a day, or a full day — used to build a realistic day-by-day "
    "schedule.")
add("travel_general", "what group types are supported", "group types,who is travelling,solo couple family friends",
    "The planner supports Solo, Couples, Family and Friends group types, and asks "
    "about children's and elderly members' ages so it can avoid unsuitable or unsafe "
    "picks for them.")
add("travel_general", "is this good for elderly travellers", "elderly travel,senior travel,travel with parents,travel with grandparents",
    "Yes — the planner asks about elderly group members and factors in each place's "
    "Difficulty_Level, so physically demanding places are weighted down for that "
    "group.")
add("travel_general", "is this good for travelling with children", "travelling with kids,travel with children,kid friendly trip",
    "Yes — tell the planner how many children and their ages, and it favours places "
    "tagged suitable for family/children and avoids high-difficulty terrain for them.")
add("travel_general", "what does entry fee mean", "entry fee,ticket price,is there an entry fee",
    "It's the approximate ticket/entry cost for that place in INR, used alongside "
    "activity, hotel and food costs to estimate your daily budget fit.")
add("travel_general", "how is the daily cost calculated", "daily cost,how is budget calculated,cost estimate",
    "It adds up a place's activity cost, an average hotel cost per night, and an "
    "average food cost per day, so the number you compare against your budget "
    "reflects a realistic full day, not just the ticket price.")

# ------------------------------------------------------- place suggestions
add("place_suggestion", "which places do you suggest", "suggest a place,recommend a place,where should i go,best place to visit,any recommendations",
    "Happy to help — mention a state you're curious about (e.g. \"places in Rajasthan\") "
    "and I'll list some top-rated spots there, or use \"Plan my trip\" for a full "
    "personalised, budget-aware itinerary.")
add("place_suggestion", "what places do you have in a state", "places in a state,what is there to see,places to visit,tourist spots",
    "Ask me by name — e.g. \"what places are in Kerala\" or \"suggest places in "
    "Chhattisgarh\" — and I'll pull the top-rated ones straight from the catalogue.")
add("place_suggestion", "surprise me with a destination", "surprise me,pick a place for me,random destination,anywhere",
    "Try the Explore page with the \"Hidden gems only\" filter on and no other filters "
    "— it's a great way to stumble on something unexpected.")

# --------------------------------------------------------- ml / how it works
add("about_ai_ml", "what machine learning models does voyexa use", "ml models,machine learning models,what models,ai models used",
    "A few, working together: a popularity regressor, a hidden-gem classifier, a "
    "similarity-based recommender for \"places like this one\", geo-clustering to "
    "group nearby places into itinerary days, and a final ranking blend that combines "
    "all the scores.")
add("about_ai_ml", "how does the hidden gem classifier work", "hidden gem classifier,hidden gem model,how are hidden gems found",
    "It's trained to spot places with strong quality signals (ratings, uniqueness, "
    "interest match) but comparatively low popularity/review counts — the sweet spot "
    "of \"great but under-visited\".")
add("about_ai_ml", "how does the itinerary grouping work", "geo clustering,how are days grouped,how is the itinerary built",
    "Your selected places are geo-clustered by latitude/longitude so nearby spots "
    "land on the same day, instead of zig-zagging across a state.")
add("about_ai_ml", "does the chatbot learn from conversations", "does the bot learn,does it get smarter,machine learning chatbot",
    "Not automatically — this assistant matches your question against a fixed, "
    "curated question bank (kept in an Excel file) rather than training itself live. "
    "When it can't answer something, that question gets logged so the team can add a "
    "proper answer to the sheet.")
add("about_ai_ml", "what happens when the chatbot doesnt know an answer", "chatbot doesnt know,no answer found,unanswered question,chatbot cant help",
    "I'll say so honestly rather than guess, and I quietly log your question so it can "
    "be reviewed and added to my answer sheet later — feel free to also describe what "
    "you needed in the feedback section.")

# ----------------------------------------------------------------- support
add("feedback_support", "how do i request a feature", "feature request,suggest a feature,can you add a feature",
    "Use the feedback section on the home page — feature suggestions are exactly what "
    "it's for.")
add("feedback_support", "is voyexa still in development", "still in development,is this finished,work in progress,beta",
    "Yes — Voyexa is an ongoing academic project. The frontend and planning experience "
    "are furthest along; the backend, real accounts and this chatbot's answer bank are "
    "actively growing.")
add("feedback_support", "can i suggest a place to add", "suggest a new place,add a place,missing place,place not listed",
    "Yes — mention it in the feedback section with as much detail as you can (name, "
    "city, state) and it'll be considered for the catalogue.")

import sys
if OUT_PATH.exists() and "--force" not in sys.argv:
    sys.exit(
        f"{OUT_PATH} already exists and has been edited by hand (full-stack wording, "
        "new tech-stack rows). Refusing to overwrite it. Pass --force if you really "
        "want to regenerate the ORIGINAL starter sheet."
    )

df = pd.DataFrame(rows, columns=["id", "category", "question", "keywords", "answer"])

OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
with pd.ExcelWriter(OUT_PATH, engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="chatbot_qna", index=False)
    ws = writer.sheets["chatbot_qna"]
    widths = {"A": 10, "B": 18, "C": 42, "D": 40, "E": 70}
    for col, w in widths.items():
        ws.column_dimensions[col].width = w
    ws.freeze_panes = "A2"

print(f"Wrote {len(df)} rows to {OUT_PATH}")
