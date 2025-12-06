import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Wallet,
  CreditCard,
  PiggyBank
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import StatsCard from '@/components/dashboard/StatsCard';

const monthlyData = [
  { month: 'Jan', earnings: 12000, expenses: 3000 },
  { month: 'Feb', earnings: 19000, expenses: 4500 },
  { month: 'Mar', earnings: 15000, expenses: 3200 },
  { month: 'Apr', earnings: 25000, expenses: 5000 },
  { month: 'May', earnings: 22000, expenses: 4200 },
  { month: 'Jun', earnings: 30000, expenses: 6000 },
  { month: 'Jul', earnings: 28000, expenses: 5500 },
];

const categoryData = [
  { category: 'Vegetables', amount: 45000 },
  { category: 'Fruits', amount: 32000 },
  { category: 'Grains', amount: 28000 },
  { category: 'Pulses', amount: 18000 },
  { category: 'Dairy', amount: 15000 },
];

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const transactions: Transaction[] = [
  { id: '1', type: 'credit', description: 'Payment for Order #ORD-004', amount: 6000, date: '2024-01-15', status: 'completed' },
  { id: '2', type: 'credit', description: 'Payment for Order #ORD-003', amount: 1200, date: '2024-01-14', status: 'completed' },
  { id: '3', type: 'debit', description: 'Platform fee', amount: 360, date: '2024-01-14', status: 'completed' },
  { id: '4', type: 'credit', description: 'Payment for Order #ORD-002', amount: 4000, date: '2024-01-13', status: 'pending' },
  { id: '5', type: 'debit', description: 'Withdrawal to bank', amount: 10000, date: '2024-01-12', status: 'completed' },
  { id: '6', type: 'credit', description: 'Payment for Order #ORD-001', amount: 2500, date: '2024-01-11', status: 'completed' },
];

const FarmerEarnings = () => {
  const [period, setPeriod] = useState('7months');

  return (
    <DashboardLayout title="Earnings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Financial Overview</h2>
            <p className="text-muted-foreground">Track your earnings and manage payments</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="7months">Last 7 months</SelectItem>
                <SelectItem value="12months">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Earnings"
            value="₹1,51,000"
            change="+12.5% from last month"
            changeType="positive"
            icon={DollarSign}
            iconColor="bg-primary/10 text-primary"
          />
          <StatsCard
            title="Available Balance"
            value="₹32,500"
            change="Ready to withdraw"
            changeType="neutral"
            icon={Wallet}
            iconColor="bg-accent/20 text-accent-foreground"
          />
          <StatsCard
            title="Pending Payments"
            value="₹8,200"
            change="3 pending orders"
            changeType="neutral"
            icon={CreditCard}
            iconColor="bg-blue-500/10 text-blue-600"
          />
          <StatsCard
            title="Total Withdrawals"
            value="₹1,10,300"
            change="This year"
            changeType="neutral"
            icon={PiggyBank}
            iconColor="bg-primary/10 text-primary"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Chart */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-lg text-foreground">Earnings vs Expenses</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Earnings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/50" />
                  <span className="text-muted-foreground">Expenses</span>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 45%, 35%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 45%, 35%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 25%, 88%)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(25, 15%, 45%)', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(25, 15%, 45%)', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(45, 25%, 97%)', 
                      border: '1px solid hsl(35, 25%, 88%)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="hsl(142, 45%, 35%)" 
                    strokeWidth={2}
                    fill="url(#earningsGradient2)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="hsl(0, 62%, 45%)" 
                    strokeWidth={2}
                    fill="url(#expensesGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
            <h3 className="font-display font-semibold text-lg text-foreground mb-6">Earnings by Category</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 25%, 88%)" horizontal={false} />
                  <XAxis 
                    type="number" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(25, 15%, 45%)', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(25, 15%, 45%)', fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(45, 25%, 97%)', 
                      border: '1px solid hsl(35, 25%, 88%)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Earnings']}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="hsl(142, 45%, 35%)" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-xl border border-border shadow-soft">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="font-display font-semibold text-lg text-foreground">Recent Transactions</h3>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All
            </Button>
          </div>
          <div className="divide-y divide-border">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'credit' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {transaction.type === 'credit' 
                      ? <ArrowDownRight className="h-5 w-5" /> 
                      : <ArrowUpRight className="h-5 w-5" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'credit' ? 'text-primary' : 'text-destructive'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </p>
                  <Badge 
                    variant={transaction.status === 'completed' ? 'default' : transaction.status === 'pending' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="bg-gradient-hero rounded-xl p-6 text-primary-foreground">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-xl mb-2">Ready to Withdraw?</h3>
              <p className="text-primary-foreground/80">
                You have ₹32,500 available for withdrawal. Transfer to your bank account instantly.
              </p>
            </div>
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2">
              <Wallet className="h-5 w-5" />
              Withdraw Funds
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FarmerEarnings;
