"use client";
import { useState, useEffect } from "react";
import axios from "axios";

interface Task {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
}

export default function Home() {
  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Task States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loggedInUser, setLoggedInUser] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");
  const [loading, setLoading] = useState(true);

  // 🔗 የኢንቫይሮመንት ፋይል ሳይጠይቅ በራሱ አድራሻውን የሚያሰላ ብልጥ መንገድ
const getApiUrl = () => {
  if (typeof window !== "undefined") {
    // መተግበሪያው ክላውድ (aletcloud) ላይ እየሰራ ከሆነ ራሱ 'https://aletcloud.com' ያደርገዋል
    if (window.location.hostname !== "localhost") {
      return `${window.location.origin}/api`;
    }
  }
  // በእርስዎ ኮምፒውተር (Locally) ሲሞክሩት ደግሞ ወደ localhost ይመለሳል
  return "http://localhost:5000/api";
};

const API_URL = getApiUrl();

  // በየጊዜው Token መኖሩን መፈተሻ (Axios Config Helper)
 // 🔑 የJWT ቶከን ፎርማትን በትክክል ማስተካከያ
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: { 
      // 🔑 በ"Bearer" እና በቶከኑ መካከል አንድ ባዶ ቦታ (Space) መኖሩን ያረጋግጡ
      Authorization: token ? `Bearer ${token}` : "" 
    }
  };
};

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    } else {
      setLoading(false);
    }
    if (isLoggedIn) fetchTasks();
  }, [isLoggedIn]);

  // =============== AUTH HANDLERS ===============
const handleAuthSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setAuthError("");
  try {
    if (authView === "register") {
      // 🔑 እዚህ ጋር የኢንቨርትድ ኮማ (Backtick) አጠቃቀም እና ${API_URL} በትክክል መጻፉን ያረጋግጡ
      await axios.post(`${API_URL}/auth/register`, { username, email, password });
      alert("ምዝገባው ተሳክቷል! አሁን መግባት ይችላሉ።");
      setAuthView("login");
      setPassword("");
    } else {
      // 🔑 እዚህም በተመሳሳይ መልኩ ይተኩት
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem("token", response.data.token);
      setIsLoggedIn(true);
    }
  } catch (error: any) {
    setAuthError(error.response?.data?.error || "የሆነ ስህተት ተፈጥሯል");
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setTasks([]);
  };

  // =============== TASK HANDLERS ===============
 const fetchTasks = async () => {
  const token = localStorage.getItem("token");
  if (!token) { setIsLoggedIn(false); return; }

  setLoading(true);
  try {
    const response = await axios.get(`${API_URL}/tasks`, getAuthHeader());
    setTasks(response.data);
    
    // 🔑 ከተግባራቱ ዝርዝር ውስጥ የመጀመሪያውን የተጠቃሚ ስም ወስዶ ይመዝግባል
    if (response.data.length > 0) {
      setLoggedInUser(response.data[0].username);
    }
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    if (error.response?.status === 401 || error.response?.status === 403) { handleLogout(); }
  } finally { setLoading(false); }
};

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await axios.post(`${API_URL}/tasks`, { title, description }, getAuthHeader());
      setTitle("");
      setDescription("");
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const updateStatus = async (id: number, currentStatus: string) => {
    let nextStatus: "pending" | "in_progress" | "completed" = "in_progress";
    if (currentStatus === "pending") nextStatus = "in_progress";
    else if (currentStatus === "in_progress") nextStatus = "completed";
    else nextStatus = "pending";

    try {
      await axios.put(`${API_URL}/tasks/${id}`, { status: nextStatus }, getAuthHeader());
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`, getAuthHeader());
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;

  const filteredTasks = tasks.filter(task => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  // ==================== VIEW 1: LOGIN / REGISTER UI ====================
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-3xl font-extrabold text-center text-white mb-2">Task Manager</h2>
          {/* የራስጌ ክፍል እና መውጫ ቁልፍ (Header) */}
    {loggedInUser && (
      // 👤 የገባውን ተጠቃሚ ስም የሚያሳይ ውብ ባጅ (Badge)
      <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full font-medium">
        እንኳን ደህና መጡ፣ {loggedInUser} 👋
      </span>
    )}

          <p className="text-center text-slate-400 text-sm mb-6">
            {authView === "login" ? "ወደ አካውንትዎ ይግቡ" : "አዲስ አካውንት እዚህ ይፍጠሩ"}
          </p>

          {authError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm mb-4 text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authView === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">የተጠቃሚ ስም</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">ኢሜይል</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">ይለፍ ቃል</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium p-3 rounded-xl shadow-lg transition-colors">
              {authView === "login" ? "ይግቡ" : "ይመዝገቡ"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              onClick={() => { setAuthView(authView === "login" ? "register" : "login"); setAuthError(""); }}
              className="text-indigo-400 hover:underline"
            >
              {authView === "login" ? "አዲስ አካውንት መፍጠር ይፈልጋሉ? ይመዝገቡ" : "አካውንት አለዎት? እዚህ ይግቡ"}
            </button>
          </div>
        </div>
      </main>
    );
  }


  // ==================== VIEW 2: MAIN DASHBOARD UI ====================
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 md:px-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* የራስጌ ክፍል እና መውጫ ቁልፍ (Header) */}
        <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-2xl">
          <h1 className="text-xl font-bold text-white tracking-wide">Task Dashboard</h1>
          <button onClick={handleLogout} className="bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            ውጣ (Logout)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* የግራ ፎርም */}
          <div className="lg:col-span-1 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 h-fit">
            <h2 className="text-lg font-bold text-white mb-4">አዲስ ተግባር ይፍጠሩ</h2>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="የስራው ርዕስ..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                required
              />
              <textarea
                placeholder="ዝርዝር መግለጫ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100"
                rows={3}
              />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium p-3 rounded-xl transition-colors">
                ተግባር ጨምር +
              </button>
            </form>
          </div>

         {/* ==================== MAIN DASHBOARD CONTENT AREA ==================== */}
<div className="lg:col-span-2 space-y-6">
  
  {/* 1. Statistics Cards Grid */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">ጠቅላላ ተግባራት</p>
      <p className="text-2xl font-bold text-white mt-1">{totalTasks}</p>
    </div>
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">ያልተጀመሩ</p>
      <p className="text-2xl font-bold text-amber-400 mt-1">{pendingTasks}</p>
    </div>
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">በሂደት ላይ ያሉ</p>
      <p className="text-2xl font-bold text-sky-400 mt-1">{inProgressTasks}</p>
    </div>
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">የተጠናቀቁ</p>
      <p className="text-2xl font-bold text-emerald-400 mt-1">{completedTasks}</p>
    </div>
  </div>

  {/* 2. Filter Tab Navigation */}
  <div className="flex bg-slate-900/80 p-1 border border-slate-800 rounded-xl text-sm w-fit">
    {(["all", "pending", "in_progress", "completed"] as const).map((type) => (
      <button
        key={type}
        onClick={() => setFilter(type)}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          filter === type 
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" 
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {type === "all" ? "ሁሉም" : type === "pending" ? "ያልተጀመረ" : type === "in_progress" ? "በሂደት ላይ" : "የተጠናቀቀ"}
      </button>
    ))}
  </div>

  {/* 3. Dynamic Task Cards Container */}
  <div className="space-y-4">
    {loading ? (
      <div className="text-center text-slate-500 py-12 animate-pulse font-medium">
        እየጫነ ነው፣ እባክዎ ይጠብቁ...
      </div>
    ) : filteredTasks.length === 0 ? (
      <div className="text-center text-slate-600 py-12 border-2 border-dashed border-slate-900 rounded-2xl">
        <p className="text-base font-medium">ምንም አይነት የተመዘገበ ተግባር አልተገኘም</p>
      </div>
    ) : (
      filteredTasks.map((task) => (
        <div 
          key={task.id} 
          className={`p-5 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
            task.status === "completed" 
              ? "bg-slate-950/20 border-emerald-950/30" 
              : "bg-slate-900/30 border-slate-800"
          }`}
        >
          <div className="space-y-1.5 flex-1">
            <h3 className={`text-lg font-bold tracking-wide ${
              task.status === "completed" ? "line-through text-slate-500" : "text-white"
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`text-sm ${task.status === "completed" ? "text-slate-600" : "text-slate-400"}`}>
                {task.description}
              </p>
            )}
            
            {/* Action Status Badge Button */}
            <button
              onClick={() => updateStatus(task.id, task.status)}
              className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border mt-2 transition-transform active:scale-95 ${
                task.status === "completed" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                  : task.status === "in_progress" 
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20" 
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                task.status === "completed" ? "bg-emerald-400" : task.status === "in_progress" ? "bg-sky-400" : "bg-amber-400"
              }`}></span>
              {task.status === "completed" ? "የተጠናቀቀ" : task.status === "in_progress" ? "በሂደት ላይ" : "ያልተጀመረ"}
            </button>
          </div>

          {/* Action Delete Button */}
          <button 
            onClick={() => deleteTask(task.id)} 
            className="bg-slate-950 text-rose-400 border border-slate-800 hover:border-rose-900/40 hover:bg-rose-950/10 px-4 py-2 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto text-center"
          >
            አጥፋ
          </button>
        </div>
      ))
    )}
  </div>

</div>
        </div>
      </div>
    </main>
  );
}
