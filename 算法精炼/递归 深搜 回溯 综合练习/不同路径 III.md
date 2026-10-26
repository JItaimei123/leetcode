在二维网格 `grid` 上，有 4 种类型的方格：

- `1` 表示起始方格。且只有一个起始方格。

- `2` 表示结束方格，且只有一个结束方格。

- `0` 表示我们可以走过的空方格。

- `-1` 表示我们无法跨越的障碍。

返回在四个方向（上、下、左、右）上行走时，从起始方格到结束方格的不同路径的数目。

每一个无障碍方格都要通过一次，但是一条路径中不能重复通过同一个方格。

示例 1：

```C++
输入：[[1,0,0,0],[0,0,0,0],[0,0,2,-1]]
输出：2
解释：我们有以下两条路径：
1. (0,0),(0,1),(0,2),(0,3),(1,3),(1,2),(1,1),(1,0),(2,0),(2,1),(2,2)
2. (0,0),(1,0),(2,0),(2,1),(1,1),(0,1),(0,2),(0,3),(1,3),(1,2),(2,2)
```

```C++
class Solution {
    int dir[4][2] = {{-1,0},{1,0},{0,-1},{0,1}};
    int totalsteps = 0;//统计一共需要走过的0
    int ans = 0;//合法的路径数
    int m,n;//成员变量
    bool vis[21][21] = {false};//标记
public:
    int uniquePathsIII(vector<vector<int>>& grid)
    {
        m = grid.size();
        n = grid[0].size();
        //得出起点
        int startx = 0,starty = 0;
        for(int i = 0;i<m;i++)
        {
            for(int j = 0;j<n;j++)
            {
                if(grid[i][j] == 0)
                totalsteps++;
                if(grid[i][j] == 1)
                {
                    startx = i;
                    starty = j;
                }
            }
        }
        dfs(grid,startx,starty,0);
        return ans;
    }
    void dfs(vector<vector<int>>& grid,int i,int j,int step)
    {
        //考虑边界情况，是否占用，以及障碍的情况
        if(i < 0 || i >= m || j < 0 || j >= n || vis[i][j] || grid[i][j] == -1) return;
        if(grid[i][j] == 2)
        {
            if(step == totalsteps)
            ans++;
            return;
        }
        vis[i][j] = true;
        //从四个方向深搜
        for(int k = 0;k<4;k++)
        {
            int nx = i + dir[k][0];
            int ny = j + dir[k][1];
            //如果这个方向的是0，那就传step + 1
            int nextstep = grid[i][j] == 0 ? step + 1 : step;
            dfs(grid,nx,ny,nextstep);
        }
        vis[i][j] = false;
    }
};
```
