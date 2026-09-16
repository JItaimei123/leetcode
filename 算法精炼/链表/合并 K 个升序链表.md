给你一个链表数组，每个链表都已经按升序排列。

请你将所有链表合并到一个升序链表中，返回合并后的链表。

示例 1：

```C++
输入：lists = [[1,4,5],[1,3,4],[2,6]]
输出：[1,1,2,3,4,4,5,6]
解释：链表数组如下：
[
  1->4->5,
  1->3->4,
  2->6
]
将它们合并到一个有序链表中得到。
1->1->2->3->4->4->5->6
```

```C++
class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) 
    {
        //lambda自定义比较方式
        auto cmp = [](ListNode* a,ListNode* b)
        {
            return a->val > b->val;
        };
        //建立小根堆
        priority_queue<ListNode*,vector<ListNode*>,decltype(cmp)> heap(cmp);
        //让所有头节点进去小根堆
       for(auto l : lists)
       {
        if(l)  heap.push(l);//堆里存的是ListNode*(指针)
       }
        //合并k个有序链表
        ListNode* ret = new ListNode(0);
        ListNode* prev = ret;
        while(!heap.empty())
        {
            ListNode* t = heap.top();//这里t也是指针
            heap.pop();
            prev->next = t;//接到结果链表
            prev = t;
            if(t->next) //对应到原来链表中的指针
            heap.push(t->next);
        }
        return ret->next;
    }
};
```
