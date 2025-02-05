import { useState } from 'react'
import Graph from './components/graph'
import { BalanceBar } from './components/balance'
import './styling/App.css'
import { SignUp } from './components/signup'
import { MainPage } from './components/mainPage'
import './styling/balancebar.css'

function App() {
  const [selectedComponent, setSelectedComponent] = useState('Login');
  const [userId, setUserId] = useState(null);

  //render page
  const renderComponent = () => {
    if (!userId) {
      switch (selectedComponent) {
        case 'Login':
          return <Login onLogin={(id) => setUserId(id)} />;
        case 'SignUp':
          return <SignUp onSignup={(id) => setUserId(id)} />;
        default:
          return <div>Select Login or Signup to proceed.</div>;
      }
    } else {
      switch (selectedComponent) {
        case 'MainPage':
          return <MainPage/>;
      }
    }
  };
  
  return (
    <>
      <div className='balancebar'>
        <BalanceBar userId={1}/>
      </div>
    </>
  )
}

export default App
