import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PieChart } from "lucide-react";
import { IdeaTable } from "./idea-table";
import { useQuery } from "@tanstack/react-query";
import { IdeaWithUser } from "@/types/ideas";

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

export function ExistingUserView() {
  const [activeTab, setActiveTab] = useState("ideas");
  
  // Simulate metrics data (this would come from an API)
  const { data: topIdeas = [] } = useQuery<IdeaWithUser[]>({
    queryKey: ["/api/ideas/top"],
  });
  
  const { data: idealVolume = [] } = useQuery<any>({
    queryKey: ["/api/ideas/volume"],
    queryFn: () => {
      // Simulated data
      return [
        { name: "5D", value: 10 },
        { name: "2W", value: 35 },
        { name: "1M", value: 80 },
        { name: "6M", value: 120 },
        { name: "1Y", value: 210 }
      ];
    }
  });
  
  // Simulated data for status breakdown
  const statusData: ChartData[] = [
    { name: "Ideas Submitted", value: 234, fill: "#4CAF50" },
    { name: "Implemented", value: 122, fill: "#2196F3" },
    { name: "Needs Review", value: 84, fill: "#FF9800" },
    { name: "Planned", value: 45, fill: "#00BCD4" },
    { name: "Future Consideration", value: 23, fill: "#F06292" }
  ];
  
  // Simulated data for activity
  const activityData = [
    {
      id: 1,
      title: "Cost optimization for cloud infrastructure",
      description: "Search for inspiration to provide a rich content experience on mobile devices.",
      status: "Need Review",
      date: "3h ago"
    },
    {
      id: 2,
      title: "Cost optimization for cloud infrastructure",
      description: "Search for inspiration to provide a rich content experience on mobile devices.",
      status: "Need Review",
      date: "3h ago"
    },
    {
      id: 3,
      title: "Cost optimization for cloud infrastructure",
      description: "Search for inspiration to provide a rich content experience on mobile devices.",
      status: "Submitted",
      date: "Apr 23"
    }
  ];
  
  // Simulated data for contributors
  const contributorsData = [
    {
      id: 1,
      name: "Kayode Shotanke",
      department: "I.T",
      value: 45
    },
    {
      id: 2,
      name: "Tobi Tajiri",
      department: "I.T",
      value: 25
    },
    {
      id: 3,
      name: "Wole Ayodele",
      department: "I.E",
      value: 21
    },
    {
      id: 4,
      name: "Yewande",
      department: "I.G",
      value: 20
    },
    {
      id: 5,
      name: "Emma Wright",
      department: "W.D",
      value: 18
    }
  ];
  
  // Simulated data for top voted ideas
  const topVotedData = [
    {
      id: 1,
      title: "Cost optimization for cloud infrastructure",
      description: "Search for inspiration to provide a rich content experience on mobile devices.",
      votes: 45,
      status: "Planned",
      date: "Apr 23"
    },
    {
      id: 2,
      title: "Cost optimization for cloud infrastructure",
      description: "Search for inspiration to provide a rich content experience on mobile devices.",
      votes: 40,
      status: "Need Review",
      date: "May 12"
    },
    {
      id: 3,
      title: "Cost optimization for cloud infrastructure",
      description: "Search for inspiration to provide a rich content experience on mobile devices.",
      votes: 39,
      status: "Submitted",
      date: "Apr 22"
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Status chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Status</CardTitle>
            <button className="text-sm text-blue-600 hover:underline">See Report</button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row">
              <div className="relative aspect-square h-40 w-40 mx-auto">
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "conic-gradient(#4CAF50 0% 46%, #2196F3 46% 70%, #FF9800 70% 87%, #00BCD4 87% 96%, #F06292 96% 100%)" }}
                >
                  <div className="h-[70%] w-[70%] rounded-full bg-white"></div>
                </div>
              </div>
              
              <div className="md:ml-6 mt-4 md:mt-0 space-y-3">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ background: item.fill }}></div>
                    <div className="flex-1 text-sm">{item.name}</div>
                    <div className="text-gray-500 text-sm">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Ideas Volume chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Ideas Volume</CardTitle>
            <button className="text-sm text-blue-600 hover:underline">See Breakdown</button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={idealVolume}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, fill: "#8884d8" }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-2 text-right">Monday, 22</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Activity section */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Activity</CardTitle>
            <button className="text-sm text-blue-600 hover:underline">See All</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activityData.map((item) => (
                <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs rounded-md py-1 px-2 ${
                      item.status === "Need Review" 
                        ? "bg-orange-100 text-orange-700" 
                        : item.status === "Submitted"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Top Contributors */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Top Contributors</CardTitle>
            <button className="text-sm text-blue-600 hover:underline">See All</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contributorsData.map((contributor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 mr-3"></div>
                    <div>
                      <div className="text-sm font-medium">{contributor.name}</div>
                      <div className="text-xs text-gray-500">{contributor.department}</div>
                    </div>
                  </div>
                  <div className="text-gray-700">{contributor.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Top Voted */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Top Voted</CardTitle>
            <button className="text-sm text-blue-600 hover:underline">See All</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topVotedData.map((item) => (
                <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-blue-700">{item.votes} Votes</span>
                    <span className={`text-xs rounded-md py-1 px-2 ${
                      item.status === "Need Review" 
                        ? "bg-orange-100 text-orange-700" 
                        : item.status === "Submitted"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-right text-xs text-gray-400 mt-1">{item.date}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}