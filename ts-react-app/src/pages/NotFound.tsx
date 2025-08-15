import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <h1>404</h1>
        <h2>页面未找到</h2>
        <p>抱歉，您访问的页面不存在。</p>
        
        <div className="actions">
          <Link to="/" className="btn btn-primary">
            返回首页
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="btn btn-secondary"
          >
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 