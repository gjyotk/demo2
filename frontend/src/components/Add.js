import { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import BulkForm from './BulkForm';
import Addvertical from './Addvertical';
import Addsensor from './Addsensor';
import { DataContext } from '../contexts/DataContext';
import DomainCreation from './DomainCreation';






function Add() {
  const { fetchAllVerticals, fetchedVerticals,fetchUser,user } = useContext(DataContext);
  const [completed, setCompleted] = useState({});
  const steps = ['Domains', 'Sensor Type', 'Node'];
  const [searchParams, setSearchParams] = useSearchParams();
  const stepFromQuery = parseInt(searchParams.get('step'), 10) || 1;

const activeStep = stepFromQuery - 1; // Convert 1-based to 0-based

  const totalSteps = () => steps.length;
  const completedSteps = () => Object.keys(completed).length;

  const allStepsCompleted = () => completedSteps() === totalSteps();

  const navigate = useNavigate();
  const handleNext = () => {
    const newStep = activeStep + 2; // add 1 to convert to 1-based, then +1
    setSearchParams({ step: newStep });
  };
  
  const handleBack = () => {
    const newStep = activeStep; // activeStep is 0-based
    setSearchParams({ step: newStep });
  };
  
  const handleStep = (step) => () => {
    setSearchParams({ step: step + 1 });
  };
  
  const handleReset = () => {
    setCompleted({});
    setSearchParams({ step: 1 });
  };
  

  const handleComplete = () => {
    const newCompleted = completed;
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
    handleNext();
  };

  useEffect(() => {
    if (!fetchedVerticals) fetchAllVerticals();
    fetchUser();
    if (user) {
      // console.log('Fetched user in Vertical.js:', user);
    }
  }, []);

  

  return (
    <Box sx={{ width: '100%', marginTop: '30px' }}>
      <Stepper nonLinear activeStep={activeStep}>
        {steps.map((label, index) => (
          <Step
            key={label}
            completed={completed[index]}
            sx={{
              '& .MuiStepLabel-root .Mui-active': {
                color: 'orange' // circle color (ACTIVE)
              },
              '& .MuiStepLabel-label.Mui-active.MuiStepLabel-alternativeLabel': {
                color: 'white' // Just text label (ACTIVE)
              },
              '& .MuiStepLabel-root .Mui-completed': {
                color: 'green' // circle color (COMPLETED)
              }
            }}>
            <StepButton onClick={handleStep(index)}>{label}</StepButton>
          </Step>
        ))}
      </Stepper>
      <div>
      {allStepsCompleted() ? (
          <>
            <Typography sx={{ mt: 2, mb: 1 }}>
              All steps completed - you&apos;re finished
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button sx={{ bgcolor: '#b4bce3' }} onClick={handleReset}>
                Reset
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Typography sx={{ mt: 2, mb: 1, py: 1 }}>
            {user?.user_type === 1 ? (
  <>
    {activeStep === 0 && <Addvertical />}
    {activeStep === 1 && <Addsensor />}
    {activeStep === 2 && <BulkForm />}
  </>
) : (
  <>
   {activeStep === 0 && <DomainCreation />}
    {activeStep === 1 && <Addsensor />}
    {activeStep === 2 && <BulkForm />}
  </>
)}

            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1, bgcolor: '#b4bce3' }}>
                Back
              </Button>

              <Box sx={{ flex: '1 1 auto' }} />
              <Button
              color="inherit"
              onClick={() => navigate('/')} sx={{ mr: 1, bgcolor: '#b4bce3' }}>
                Cancel
              </Button>
              {activeStep !== steps.length && (
                <Button 
                color="inherit"
                onClick={handleComplete} sx={{ bgcolor: '#b4bce3' }}>
                  {activeStep === steps.length - 1 ? 'Finish' : 'NEXT'}
                </Button>
              )}
            </Box>
          </>
        )}
      </div>
    </Box>
  );
}

export default Add;
