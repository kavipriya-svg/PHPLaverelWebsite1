import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Save, 
  Upload, 
  Trash2, 
  Loader2, 
  GripVertical,
  Plus,
  Eye,
  EyeOff,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category, HomeCategorySection, HomeCategorySectionItem } from "@shared/schema";

const defaultSettings: HomeCategorySection = {
  title: "Shop by Category",
  subtitle: "",
  isVisible: true,
  position: 0,
  categories: [],
};

const widthOptions = [
  { value: "25", label: "25%", description: "Quarter width" },
  { value: "50", label: "50%", description: "Half width" },
  { value: "75", label: "75%", description: "Three-quarter width" },
  { value: "100", label: "100%", description: "Full width" },
];

const alignmentOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export default function CategorySectionSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<HomeCategorySection>(defaultSettings);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ settings: HomeCategorySection }>({
    queryKey: ["/api/settings/home-category-section"],
  });

  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["/api/categories", { level: 1 }],
  });

  const allCategories = categoriesData?.categories || [];

  useEffect(() => {
    if (data?.settings) {
      setSettings({ ...defaultSettings, ...data.settings });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: HomeCategorySection) => {
      const response = await apiRequest("PUT", "/api/settings/home-category-section", newSettings);
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/home-category-section"] });
      toast({ title: "Category section settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    categoryId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(categoryId);

    try {
      const presignedResponse = await apiRequest("POST", "/api/upload/presigned-url", {
        filename: file.name,
        contentType: file.type,
        folder: "categories",
      });
      
      if (!presignedResponse.ok) {
        throw new Error("Failed to get upload URL");
      }
      
      const { presignedUrl, objectPath } = await presignedResponse.json();

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const finalizeResponse = await apiRequest("POST", "/api/admin/upload/finalize", {
        uploadURL: presignedUrl,
      });
      
      if (!finalizeResponse.ok) {
        throw new Error("Failed to finalize upload");
      }
      
      const finalizedResult = await finalizeResponse.json();
      const finalUrl = finalizedResult.objectPath || `/objects/${objectPath}`;
      
      setSettings(prev => ({
        ...prev,
        categories: prev.categories.map(cat => 
          cat.categoryId === categoryId ? { ...cat, imageUrl: finalUrl } : cat
        )
      }));
      
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ 
        title: "Failed to upload image", 
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive" 
      });
    } finally {
      setUploadingId(null);
    }
  };

  const addCategory = (categoryId: string) => {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    const exists = settings.categories.some(c => c.categoryId === categoryId);
    if (exists) {
      toast({ title: "Category already added", variant: "destructive" });
      return;
    }

    const newItem: HomeCategorySectionItem = {
      categoryId,
      customLabel: category.name,
      imageUrl: category.imageUrl || category.bannerUrl || "",
      position: settings.categories.length,
      isVisible: true,
      displayWidth: "50",
      alignment: "center",
    };

    setSettings(prev => ({
      ...prev,
      categories: [...prev.categories, newItem]
    }));
  };

  const updateCategoryWidth = (categoryId: string, displayWidth: "25" | "50" | "75" | "100") => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.map(c => 
        c.categoryId === categoryId ? { ...c, displayWidth } : c
      )
    }));
  };

  const updateCategoryAlignment = (categoryId: string, alignment: "left" | "center" | "right") => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.map(c => 
        c.categoryId === categoryId ? { ...c, alignment } : c
      )
    }));
  };

  const removeCategory = (categoryId: string) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories
        .filter(c => c.categoryId !== categoryId)
        .map((c, idx) => ({ ...c, position: idx }))
    }));
  };

  const toggleCategoryVisibility = (categoryId: string) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.map(c => 
        c.categoryId === categoryId ? { ...c, isVisible: !c.isVisible } : c
      )
    }));
  };

  const updateCategoryLabel = (categoryId: string, customLabel: string) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.map(c => 
        c.categoryId === categoryId ? { ...c, customLabel } : c
      )
    }));
  };

  const moveCategory = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= settings.categories.length) return;

    const newCategories = [...settings.categories];
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];
    newCategories.forEach((c, idx) => c.position = idx);

    setSettings(prev => ({ ...prev, categories: newCategories }));
  };

  const getCategoryDetails = (categoryId: string) => {
    return allCategories.find(c => c.id === categoryId);
  };

  const availableCategories = allCategories.filter(
    c => !settings.categories.some(sc => sc.categoryId === c.id)
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shop by Category Section</h1>
            <p className="text-muted-foreground">
              Manage the category showcase section on your homepage
            </p>
          </div>
          <Button 
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending}
            data-testid="button-save-category-section"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Settings</CardTitle>
              <CardDescription>
                Configure the visibility and title of the category section
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Section</Label>
                  <p className="text-sm text-muted-foreground">
                    Display the category section on homepage
                  </p>
                </div>
                <Switch
                  checked={settings.isVisible}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, isVisible: checked }))
                  }
                  data-testid="switch-section-visibility"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="section-title">Section Title</Label>
                <Input
                  id="section-title"
                  value={settings.title}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Shop by Category"
                  data-testid="input-section-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="section-subtitle">Subtitle (Optional)</Label>
                <Input
                  id="section-subtitle"
                  value={settings.subtitle}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, subtitle: e.target.value }))
                  }
                  placeholder="Browse our collection"
                  data-testid="input-section-subtitle"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Add and arrange categories to display in this section
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select onValueChange={addCategory}>
                  <SelectTrigger className="flex-1" data-testid="select-add-category">
                    <SelectValue placeholder="Add a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No more categories available
                      </div>
                    ) : (
                      availableCategories.map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.id}
                          data-testid={`option-category-${category.id}`}
                        >
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {settings.categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No categories added yet</p>
                  <p className="text-sm">Add categories from the dropdown above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settings.categories
                    .sort((a, b) => a.position - b.position)
                    .map((item, index) => {
                      const category = getCategoryDetails(item.categoryId);
                      const displayImage = item.imageUrl || category?.imageUrl || category?.bannerUrl;
                      
                      return (
                        <div 
                          key={item.categoryId}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                          data-testid={`category-item-${item.categoryId}`}
                        >
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveCategory(index, "up")}
                              disabled={index === 0}
                            >
                              <GripVertical className="w-4 h-4 rotate-90" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveCategory(index, "down")}
                              disabled={index === settings.categories.length - 1}
                            >
                              <GripVertical className="w-4 h-4 rotate-90" />
                            </Button>
                          </div>

                          <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                            {displayImage ? (
                              <img 
                                src={displayImage} 
                                alt={item.customLabel || category?.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-3">
                            <Input
                              value={item.customLabel || ""}
                              onChange={(e) => updateCategoryLabel(item.categoryId, e.target.value)}
                              placeholder={category?.name || "Category name"}
                              data-testid={`input-category-label-${item.categoryId}`}
                            />
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Width</Label>
                                <Select 
                                  value={item.displayWidth || "50"} 
                                  onValueChange={(value) => updateCategoryWidth(item.categoryId, value as "25" | "50" | "75" | "100")}
                                >
                                  <SelectTrigger className="h-8" data-testid={`select-width-${item.categoryId}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {widthOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Alignment</Label>
                                <Select 
                                  value={item.alignment || "center"} 
                                  onValueChange={(value) => updateCategoryAlignment(item.categoryId, value as "left" | "center" | "right")}
                                >
                                  <SelectTrigger className="h-8" data-testid={`select-alignment-${item.categoryId}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {alignmentOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Label 
                                htmlFor={`upload-${item.categoryId}`}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-1 text-xs text-primary hover:underline">
                                  {uploadingId === item.categoryId ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Upload className="w-3 h-3" />
                                  )}
                                  Custom Image
                                </div>
                                <input
                                  id={`upload-${item.categoryId}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(e, item.categoryId)}
                                  disabled={uploadingId === item.categoryId}
                                />
                              </Label>
                              {item.imageUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => setSettings(prev => ({
                                    ...prev,
                                    categories: prev.categories.map(c => 
                                      c.categoryId === item.categoryId 
                                        ? { ...c, imageUrl: "" } 
                                        : c
                                    )
                                  }))}
                                >
                                  Reset to default
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleCategoryVisibility(item.categoryId)}
                              data-testid={`button-toggle-visibility-${item.categoryId}`}
                            >
                              {item.isVisible ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCategory(item.categoryId)}
                              data-testid={`button-remove-category-${item.categoryId}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                How the section will appear on your homepage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!settings.isVisible ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                  <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Section is currently hidden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{settings.title || "Shop by Category"}</h3>
                    {settings.subtitle && (
                      <p className="text-muted-foreground">{settings.subtitle}</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {(() => {
                      const visibleItems = settings.categories
                        .filter(c => c.isVisible)
                        .sort((a, b) => a.position - b.position);
                      
                      const rows: typeof visibleItems[] = [];
                      let currentRow: typeof visibleItems = [];
                      let currentRowWidth = 0;
                      
                      for (const item of visibleItems) {
                        const width = parseInt(item.displayWidth || "50");
                        
                        if (width === 100) {
                          if (currentRow.length > 0) {
                            rows.push(currentRow);
                            currentRow = [];
                            currentRowWidth = 0;
                          }
                          rows.push([item]);
                        } else if (currentRowWidth + width <= 100) {
                          currentRow.push(item);
                          currentRowWidth += width;
                          if (currentRowWidth === 100) {
                            rows.push(currentRow);
                            currentRow = [];
                            currentRowWidth = 0;
                          }
                        } else {
                          if (currentRow.length > 0) {
                            rows.push(currentRow);
                          }
                          currentRow = [item];
                          currentRowWidth = width;
                        }
                      }
                      
                      if (currentRow.length > 0) {
                        rows.push(currentRow);
                      }
                      
                      return rows.map((row, rowIndex) => {
                        const isSingleItem = row.length === 1;
                        const item = row[0];
                        
                        if (isSingleItem) {
                          const width = parseInt(item.displayWidth || "50");
                          const widthClass = 
                            width === 100 ? "w-full" :
                            item.displayWidth === "25" ? "w-1/4" :
                            item.displayWidth === "75" ? "w-3/4" :
                            "w-1/2";
                          const alignClass = width === 100 ? "" :
                            item.alignment === "left" ? "mr-auto" :
                            item.alignment === "right" ? "ml-auto" :
                            "mx-auto";
                          
                          const category = getCategoryDetails(item.categoryId);
                          const displayImage = item.imageUrl || category?.imageUrl || category?.bannerUrl;
                          
                          return (
                            <div key={rowIndex} className={`${widthClass} ${alignClass}`}>
                              <div className="aspect-square rounded-lg overflow-hidden relative">
                                {displayImage ? (
                                  <img src={displayImage} alt={item.customLabel || category?.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                                  <h4 className="text-white font-semibold">{item.customLabel || category?.name}</h4>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        const totalWidth = row.reduce((sum, r) => sum + parseInt(r.displayWidth || "50"), 0);
                        const isPartialRow = totalWidth < 100;
                        
                        const widthClass = totalWidth === 100 ? "w-full" : 
                          totalWidth === 25 ? "w-1/4" :
                          totalWidth === 50 ? "w-1/2" :
                          totalWidth === 75 ? "w-3/4" :
                          "w-full";
                          
                        const alignClass = !isPartialRow ? "" :
                          row[0]?.alignment === "left" ? "mr-auto" : 
                          row[0]?.alignment === "right" ? "ml-auto" : 
                          "mx-auto";
                        
                        const gridCols = row.map(r => {
                          const w = parseInt(r.displayWidth || "50");
                          return w === 25 ? "1fr" : w === 50 ? "2fr" : w === 75 ? "3fr" : "4fr";
                        }).join(" ");
                        
                        return (
                          <div key={rowIndex} className={`${widthClass} ${alignClass}`}>
                            <div 
                              className="grid gap-4"
                              style={{ gridTemplateColumns: gridCols }}
                            >
                              {row.map((item) => {
                                const category = getCategoryDetails(item.categoryId);
                                const displayImage = item.imageUrl || category?.imageUrl || category?.bannerUrl;
                                
                                return (
                                  <div 
                                    key={item.categoryId}
                                    className="aspect-square rounded-lg overflow-hidden relative"
                                  >
                                    {displayImage ? (
                                      <img src={displayImage} alt={item.customLabel || category?.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                                      <h4 className="text-white font-semibold">{item.customLabel || category?.name}</h4>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  {settings.categories.filter(c => c.isVisible).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No visible categories to display</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
