## [返回倒数第k个节点](#返回倒数第k个节点)

实现一种算法，找出单向链表中倒数第 k 个节点。返回该节点的值。

**示例：**

```C++
输入： 1->2->3->4->5 和 k = 2
输出： 4
```

思路：定义一个快指针一个慢指针，让快指针先走 k 步，慢指针再与快指针同步走，当快指针走到 NULL 的时候，那慢指针所在的位置即是倒数第 k 个。

```C++
class Solution
{
public:
    int kthToLast(ListNode* head, int k) 
    {
        struct ListNode * slow = head, *fast = head;
        while(k--)
        {
            fast = fast->next;
        }
        while(fast)
        {
            slow = slow->next;
            fast = fast->next;
        }
        return slow->val;
    }
};
```

---
