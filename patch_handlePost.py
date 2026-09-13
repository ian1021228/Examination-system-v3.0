with open("src/features.tsx", "r") as f:
    content = f.read()

content = content.replace("""  const handlePost = async () => {
    if (!title.trim() || !content.trim()) return;
    await addDoc(collection(db, 'announcements'), {
      title, content, author: '系統管理員', createdAt: Date.now()
    });
    toast('發布成功！');
    setTitle(''); setContent('');
    fetchAnnouncements();
  };""", """  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      toast('請填寫標題與內容');
      return;
    }
    try {
      await addDoc(collection(db, 'announcements'), {
        title, content, author: '系統管理員', createdAt: Date.now()
      });
      toast('發布成功！');
      setTitle(''); setContent('');
      fetchAnnouncements();
    } catch (e: any) {
      console.error(e);
      toast('發布失敗: ' + e.message);
    }
  };""")

with open("src/features.tsx", "w") as f:
    f.write(content)
