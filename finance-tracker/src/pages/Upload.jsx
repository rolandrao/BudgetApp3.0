import { useState, useCallback, useEffect } from 'react'
import Papa from 'papaparse'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../lib/supabase'
import { 
  FileSpreadsheet, 
  Save,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Play,
  Trash2,
  FileText
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CATEGORIES = [
  "Subscriptions", "Groceries", "Food", "Cat", "Transportation",
  "Bills", "Fun", "Miscellaneous", "Uber Eats", "Shopping"
];

// --- 1. Parser Logic ---
const parseFile = (file) => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        let formattedData = [];
        let source = 'Unknown';
        const filename = file.name.toLowerCase();

        // CHASE (Marriott)
        if (filename.includes('marriott')) {
          source = 'Chase (Marriott)';
          formattedData = data.map(row => ({
            id: crypto.randomUUID(),
            date: new Date(row['Transaction Date'] || row['Post Date']).toISOString().split('T')[0],
            description: row['Description'],
            amount: parseFloat(row['Amount']),
            category: '', 
            // paid_by set later
            is_shared: false,
            exclude: false,
            source
          }));
        } 
        // APPLE CARD
        else if (filename.includes('apple')) {
          source = 'Apple Card';
          formattedData = data.map(row => ({
            id: crypto.randomUUID(),
            date: new Date(row['Transaction Date']).toISOString().split('T')[0],
            description: row['Merchant'] || row['Description'],
            amount: parseFloat(row['Amount (USD)']) * -1,
            category: '',
            // paid_by set later
            is_shared: false,
            exclude: false,
            source
          }));
        } 
        // CAPITAL ONE
        else if (filename.includes('capital_one')) {
          source = 'Capital One';
          formattedData = data.map(row => {
            let amount = 0;
            if (row['Debit']) amount = parseFloat(row['Debit']) * -1;
            else if (row['Credit']) amount = parseFloat(row['Credit']);
            return {
              id: crypto.randomUUID(),
              date: new Date(row['Transaction Date']).toISOString().split('T')[0],
              description: row['Description'],
              amount: amount,
              category: '',
              // paid_by set later
              is_shared: false,
              exclude: false,
              source
            }
          });
        }
        resolve({ source, data: formattedData });
      }
    });
  });
};

export default function UploadPage() {
  // Setup State
  const [rawFiles, setRawFiles] = useState([]);
  const [defaultUser, setDefaultUser] = useState('Roland');
  
  // Factory State
  const [stagedData, setStagedData] = useState([]);
  const [currIndex, setCurrIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  // --- Helpers ---
  const updateRow = (id, updates) => {
    setStagedData(prev => prev.map(row => row.id === id ? { ...row, ...updates } : row));
  };

  const advance = () => {
    if (currIndex < stagedData.length - 1) {
      setCurrIndex(prev => prev + 1);
    }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (stagedData.length === 0) return;

      const current = stagedData[currIndex];

      switch(e.key.toLowerCase()) {
        case 's': // Shared -> Next
          updateRow(current.id, { is_shared: true, exclude: false });
          advance();
          break;
        case 'w': // Personal (Not Shared) -> Next
          updateRow(current.id, { is_shared: false, exclude: false });
          advance();
          break;
        case 'x': // Exclude -> Next
          updateRow(current.id, { exclude: true });
          advance();
          break;
        case 'a': // Prev
        case 'arrowleft':
          if (currIndex > 0) setCurrIndex(currIndex - 1);
          break;
        case 'd': // Next (Skip)
        case 'arrowright':
          if (currIndex < stagedData.length - 1) setCurrIndex(currIndex + 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stagedData, currIndex]);

  const selectCategory = (category) => {
    updateRow(stagedData[currIndex].id, { category });
  };

  // --- File Handling ---
  const onDrop = useCallback((acceptedFiles) => {
    // Just add to list, don't parse yet
    setRawFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'text/csv': ['.csv'] } 
  });

  const removeFile = (index) => {
    setRawFiles(prev => prev.filter((_, i) => i !== index));
  }

  // --- START PROCESS ---
  const handleStartCategorizing = async () => {
    if (rawFiles.length === 0) return;
    
    let allData = [];
    for (const file of rawFiles) {
      const { data } = await parseFile(file);
      // APPLY DEFAULT USER HERE
      const dataWithUser = data.map(row => ({
        ...row,
        paid_by: defaultUser // Force the selected user
      }));
      allData.push(...dataWithUser);
    }
    
    setStagedData(allData);
    setRawFiles([]); // Clear file list
  };

  // --- SAVE TO DB ---
  const handleUploadToDB = async () => {
    setUploading(true);
    // Validation
    const missingUser = stagedData.some(row => !row.exclude && !row.paid_by);
    if (missingUser) {
        alert("Some transactions are missing a 'Paid By' user.");
        setUploading(false);
        return;
    }
    const missingCategory = stagedData.some(row => !row.exclude && !row.category);
    if (missingCategory) {
        if(!confirm("Some transactions have no category. Save anyway?")) {
            setUploading(false);
            return;
        }
    }

    const toUpload = stagedData
      .filter(row => !row.exclude)
      .map(row => ({
        transaction_date: row.date,
        description: row.description,
        amount: row.amount * -1, // Flip Sign (Negative -> Positive)
        category: row.category,
        paid_by: row.paid_by,
        is_shared: row.is_shared,
        created_at: new Date().toISOString()
      }));

    if (toUpload.length === 0) {
      alert("No transactions to upload.");
      setUploading(false);
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(toUpload)
      .select();

    if (error) {
      console.error("Supabase Error:", error);
      alert(`Error: ${error.message}`);
    } else if (!data || data.length === 0) {
      console.error("Insert succeeded but returned no data.");
      alert("Error: Database accepted request but saved 0 rows. Check RLS policies.");
    } else {
      setStagedData([]); 
      setCurrIndex(0);
      alert(`Success! Saved ${data.length} transactions.`);
    }
    setUploading(false);
  };

  // --- Render ---
  const currentItem = stagedData[currIndex];
  const progress = stagedData.length > 0 ? ((currIndex + 1) / stagedData.length) * 100 : 0;
  const excludedCount = stagedData.filter(r => r.exclude).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in px-4 sm:px-0">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {stagedData.length === 0 ? "Upload & Setup" : "Categorize"}
          </h1>
          <p className="text-muted-foreground">
            {stagedData.length === 0 
              ? "Prepare your files and select the default user."
              : "Factory Mode: Click Category → Press Key (S/W/X)"}
          </p>
        </div>
        
        {/* Save Button (Only in Factory Mode) */}
        {stagedData.length > 0 && (
           <div className="flex items-center gap-4">
              <div className="text-right text-sm text-muted-foreground">
                 <p>{stagedData.length - excludedCount} Active</p>
                 <p>{excludedCount} Excluded</p>
              </div>
              <Button onClick={handleUploadToDB} disabled={uploading} size="lg">
                 {uploading ? "Saving..." : "Finish & Save"}
                 <Save className="ml-2 h-4 w-4" />
              </Button>
           </div>
        )}
      </div>

      {stagedData.length === 0 ? (
        // --- PHASE 1: STAGING AREA ---
        <div className="grid gap-8">
            
            {/* Drop Zone */}
            <div 
                {...getRootProps()} 
                className={`
                    border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-primary/10 p-6 rounded-full text-primary">
                        <FileSpreadsheet className="h-10 w-10" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold">Drag & Drop CSVs here</h3>
                        <p className="text-muted-foreground">Apple, Chase, or Capital One</p>
                    </div>
                </div>
            </div>

            {/* File List & Config */}
            {rawFiles.length > 0 && (
                <Card className="animate-in slide-in-from-bottom-4">
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Review files and select defaults before starting.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* File List */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Selected Files</label>
                            {rawFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-muted/40">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-blue-500" />
                                        <span className="text-sm font-medium">{file.name}</span>
                                        <Badge variant="outline" className="text-xs">{(file.size / 1024).toFixed(0)} KB</Badge>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeFile(idx)}>
                                        <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            {/* Default User Dropdown */}
                            <div className="w-full md:w-1/3 space-y-2">
                                <label className="text-sm font-medium">Default User</label>
                                <Select value={defaultUser} onValueChange={setDefaultUser}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Roland">Roland</SelectItem>
                                        <SelectItem value="Sarah">Sarah</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">This user will be applied to all transactions automatically.</p>
                            </div>

                            {/* Start Button */}
                            <Button size="lg" className="w-full md:w-auto" onClick={handleStartCategorizing}>
                                Start Categorizing <Play className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
      ) : (
        // --- PHASE 2: FACTORY MODE ---
        <div className="space-y-8">
            
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span>Transaction {currIndex + 1} of {stagedData.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Main Focus Card */}
            <Card className={`border-2 transition-all shadow-lg ${currentItem.exclude ? 'opacity-60 bg-muted border-dashed' : 'border-primary/20'}`}>
                <CardHeader className="text-center pb-2">
                    <CardDescription>{currentItem.date} • {currentItem.source}</CardDescription>
                    <CardTitle className="text-3xl font-bold mt-2">{currentItem.description}</CardTitle>
                    <div className={`text-4xl font-mono font-bold mt-4 ${currentItem.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        ${Math.abs(currentItem.amount).toFixed(2)}
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 pt-6">
                    
                    {/* User Selection */}
                    <div className="w-full max-w-xs">
                         <Select 
                            value={currentItem.paid_by} 
                            onValueChange={(val) => updateRow(currentItem.id, { paid_by: val })}
                         >
                            <SelectTrigger className="text-center">
                                <SelectValue placeholder="Select User" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Roland">Roland</SelectItem>
                                <SelectItem value="Sarah">Sarah</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full h-px bg-border my-2" />

                    {/* Category Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
                        {CATEGORIES.map(cat => {
                            const isActive = currentItem.category === cat;
                            return (
                                <div
                                    key={cat}
                                    onClick={() => selectCategory(cat)}
                                    className={`
                                        h-14 flex items-center justify-center text-sm font-medium rounded-lg border-2 cursor-pointer transition-all shadow-sm
                                        ${isActive 
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-2 ring-blue-500 ring-offset-2' 
                                            : 'border-transparent bg-secondary hover:bg-secondary/80'
                                        }
                                    `}
                                >
                                    {cat}
                                </div>
                            )
                        })}
                    </div>

                </CardContent>
            </Card>

            {/* Footer / Legend */}
            <div className="grid grid-cols-3 gap-4 text-center">
                <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 border-dashed" onClick={() => { updateRow(currentItem.id, { exclude: true }); advance(); }}>
                    <X className="h-5 w-5 mb-1" />
                    <span className="font-bold">Exclude (X)</span>
                    <span className="text-xs text-muted-foreground font-normal">Next</span>
                </Button>

                <Button variant="outline" className={`h-auto py-3 flex flex-col gap-1 ${!currentItem.is_shared && !currentItem.exclude ? 'border-primary bg-primary/5' : ''}`} onClick={() => { updateRow(currentItem.id, { is_shared: false }); advance(); }}>
                    <User className="h-5 w-5 mb-1" />
                    <span className="font-bold">Personal (W)</span>
                    <span className="text-xs text-muted-foreground font-normal">Next</span>
                </Button>

                <Button variant="outline" className={`h-auto py-3 flex flex-col gap-1 ${currentItem.is_shared && !currentItem.exclude ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`} onClick={() => { updateRow(currentItem.id, { is_shared: true }); advance(); }}>
                    <Users className="h-5 w-5 mb-1" />
                    <span className="font-bold">Shared (S)</span>
                    <span className="text-xs text-muted-foreground font-normal">Next</span>
                </Button>
            </div>
            
             <div className="flex justify-between w-full text-xs text-muted-foreground px-4">
                 <span><kbd className="bg-muted px-1 rounded">A</kbd> Previous</span>
                 <span><kbd className="bg-muted px-1 rounded">D</kbd> Skip</span>
             </div>

        </div>
      )}
    </div>
  )
}