实现一种算法，找出单向链表中倒数第 k 个节点。返回该节点的值。

**注意：**本题相对原题稍作改动

**示例：**

```C++
输入： 1->2->3->4->5 和 k = 2
输出： 4
```

**说明：**

给定的 *k* 保证是有效的。

思路:定义一个快指针一个慢指针,让快指针先走k步,慢指针再与快指针同步走,当快指针走到NULL的时候,那慢指针所在的位置即是倒数第k个

```C++
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution
{
public:
    int kthToLast(ListNode* head, int k) 
    {
        struct ListNode * slow = head,*fast = head;
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