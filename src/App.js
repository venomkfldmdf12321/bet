import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DollarSign, Clock, AlertCircle, Check, X } from 'lucide-react';
import './index.css';

function App() {
  // const [odds, setOdds] = useState([]);
  const [bets, setBets] = useState([]);
  const [budgetInput, setBudgetInput] = useState(100000);
  const [budget, setBudget] = useState(100000);
  const [availableBudget, setAvailableBudget] = useState(100000);
  const [totalBet, setTotalBet] = useState(0);
  const [matchNumber, setMatchNumber] = useState(0);
  const [liveOdds, setLiveOdds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTeam, setModalTeam] = useState('');
  const [modalOdd, setModalOdd] = useState(0);
  const [modalMatchIndex, setModalMatchIndex] = useState(0);
  const [modalStake, setModalStake] = useState('');
  const [potentialReturn, setPotentialReturn] = useState(0);
  const [stakeError, setStakeError] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const simulatedOdds = useMemo(() => [
    ['2.40', '15.00', '1.60'],
    ['3.25', '17.00', '1.35'],
    ['4.75', '19.00', '1.20'],
    ['2.20', '13.00', '1.77'],
    ['2.40', '13.00', '1.60'],
    ['1.35', '15.00', '3.25'],
    ['1.60', '12.00', '2.50'],
    ['3.75', '11.00', '1.35'],
    ['3.10', '9.50', '1.50'],
    ['1.95', '8.00', '2.10'],
    ['2.40', '13.00', '1.60'],
    ['1.35', '15.00', '3.25'],
    ['1.60', '12.00', '2.50'],
    ['3.75', '11.00', '1.35'],
    ['3.10', '9.50', '1.50'],
    ['1.95', '8.00', '2.10'],
    ['10.00', '1.01'],
    ['3.00', '1.30'],
  ], []);

  const fetchOdds = useCallback(() => {
    if (matchNumber < simulatedOdds.length) {
      const oddsForCurrentMatch = simulatedOdds[matchNumber];
      let formattedOdds = [];
      if (oddsForCurrentMatch && oddsForCurrentMatch.length >= 2) {
        formattedOdds = [
          { team: 'Team 1', odd: parseFloat(oddsForCurrentMatch[0]) },
          { team: 'Team 2', odd: parseFloat(oddsForCurrentMatch[oddsForCurrentMatch.length === 3 ? 2 : 1]) },
        ];
      } else if (oddsForCurrentMatch === undefined) {
        formattedOdds = [];
        console.log(`No odds available for match number ${matchNumber + 1}`);
      }
      setLiveOdds(formattedOdds);
    } else {
      setLiveOdds([]);
      console.log(`No more simulated matches available after match number ${simulatedOdds.length}`);
    }
  }, [matchNumber, simulatedOdds]);

  useEffect(() => {
    fetchOdds();
    const intervalId = setInterval(() => {
      setMatchNumber((prev) => prev + 1);
      fetchOdds();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [matchNumber, fetchOdds]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    setAvailableBudget(budget - totalBet);
  }, [budget, totalBet]);


  const handleOpenModal = (team, odd, matchIndex) => {
    setModalTeam(team);
    setModalOdd(odd);
    setModalMatchIndex(matchIndex);
    setModalStake('');
    setPotentialReturn(0);
    setStakeError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleStakeChange = (event) => {
    const stake = event.target.value;
    setModalStake(stake);
    setStakeError('');
    if (!isNaN(stake) && stake !== '') {
      setPotentialReturn(parseFloat(stake) * modalOdd);
    } else {
      setPotentialReturn(0);
    }
  };

  const handlePlaceBet = () => {
    const numericStake = parseFloat(modalStake);

    if (isNaN(numericStake) || numericStake <= 0) {
      setStakeError('Stake amount must be a valid number greater than zero.');
      return;
    }

    if (numericStake > availableBudget) {
      setStakeError('Insufficient available budget to place this bet.');
      return;
    }

    setBets((prevBets) => {
      const newBets = [...prevBets];
      const existingBetIndex = newBets.findIndex(
        (bet) => bet.team === modalTeam && bet.matchIndex === modalMatchIndex
      );

      if (existingBetIndex !== -1) {
        const removedBetAmount = newBets[existingBetIndex].amount;
        newBets.splice(existingBetIndex, 1);
        setNotification({
          show: true,
          message: `Bet removed for ${modalTeam} - ₹${removedBetAmount} returned`,
          type: 'info'
        });
      } else {
        newBets.push({ team: modalTeam, odd: modalOdd, amount: numericStake, matchIndex: modalMatchIndex });
        setNotification({
          show: true,
          message: `Bet placed on ${modalTeam} - ₹${numericStake}`,
          type: 'success'
        });
      }

      return newBets;
    });

    setIsModalOpen(false);
  };

  const calculateTotalBetForTeamAndMatch = (team, matchIndex) => {
    return bets
      .filter((bet) => bet.team === team && bet.matchIndex === matchIndex)
      .reduce((total, bet) => total + bet.amount, 0);
  };

  const calculatePotentialReturnForDisplay = (team, odd, matchIndex) => {
    const totalBetForTeam = calculateTotalBetForTeamAndMatch(team, matchIndex);
    return totalBetForTeam * odd;
  };

  const calculateCombinedTotalBet = useCallback(() => {
    return bets.reduce((total, bet) => total + bet.amount, 0);
  }, [bets]);

  const calculatePotentialReturnsSummary = () => {
    const teamReturns = {};
    bets.forEach(bet => {
      const profit = bet.amount * (bet.odd - 1);
      if (!teamReturns[bet.team]) {
        teamReturns[bet.team] = { totalProfit: 0, bets: [] };
      }
      teamReturns[bet.team].totalProfit += profit;
      teamReturns[bet.team].bets.push({ odd: bet.odd, amount: bet.amount, profit: profit });
    });
    return teamReturns;
  };


  useEffect(() => {
    setTotalBet(calculateCombinedTotalBet());
  }, [bets, calculateCombinedTotalBet]);

  const getColorBasedOnOdds = (odd) => {
    if (odd < 2) return 'bg-blue-100 border-blue-300';
    if (odd < 5) return 'bg-green-100 border-green-300';
    if (odd < 10) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleBudgetInputChange = (event) => {
    setBudgetInput(event.target.value);
  };

  const handleBudgetSubmit = () => {
    const newBudget = parseFloat(budgetInput);
    if (!isNaN(newBudget) && newBudget >= 0) {
      setBudget(newBudget);
      setNotification({ show: true, message: `Budget updated to ${formatCurrency(newBudget)}`, type: 'success' });
    } else {
      setNotification({ show: true, message: 'Invalid budget input', type: 'error' });
      setBudgetInput(budget);
    }
  };


  const returnsSummary = calculatePotentialReturnsSummary();


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
          notification.type === 'info' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
          'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {notification.type === 'success' ? <Check size={18} /> :
           notification.type === 'info' ? <AlertCircle size={18} /> :
           <X size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="container mx-auto p-4 max-w-6xl">
        <header className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Smart Betting Dashboard</h1>
              <p className="text-gray-500 mt-1">Real-time odds and intelligent bet tracking</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col md:items-end">
              <div className="flex items-center mb-2">
                <label htmlFor="budgetInput" className="mr-2 font-semibold text-gray-700">Set Budget:</label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    id="budgetInput"
                    className="border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-[80px] sm:min-w-[120px] rounded-r-md sm:text-sm"
                    placeholder="Enter budget"
                    value={budgetInput}
                    onChange={handleBudgetInputChange}
                  />
                </div>
                <button
                  onClick={handleBudgetSubmit}
                  className="ml-2 px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Update
                </button>
              </div>


              {/* <div className="flex items-center text-lg">
                <DollarSign className="text-emerald-500 mr-2" size={24} />
                <span className="font-semibold text-gray-700">Available Budget:</span>
                <span className="ml-2 text-xl font-bold text-emerald-600">{formatCurrency(availableBudget)}</span>
              </div> */}
            </div>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Clock size={20} className="mr-2" />
              <h3 className="text-lg font-semibold">
                {liveOdds.length > 0 ? (
                  `Odd #${matchNumber + 1} - ${liveOdds.map(item => item.odd.toFixed(2)).join(' / ')}`
                ) : (
                  `Odd #${matchNumber + 1} - Live Odds`
                )}
              </h3>            </div>
          </div>

          <div className="p-4">
            {liveOdds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveOdds.map(({ team, odd }, index) => {
                  const hasBet = calculateTotalBetForTeamAndMatch(team, matchNumber) > 0;
                  const colorClass = getColorBasedOnOdds(odd);

                  return (
                    <div
                      key={`${team}-${matchNumber}`}
                      className={`rounded-lg border-2 ${hasBet ? 'border-indigo-500 shadow-md' : 'border-gray-200'} overflow-hidden`}
                    >
                      <div className={`p-4 ${hasBet ? 'bg-indigo-50' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-lg text-gray-800">{team}</h4>
                          <div className={`px-4 py-2 rounded-full ${colorClass} font-bold`}>
                            {odd.toFixed(2)}
                          </div>
                        </div>

                        <div className="space-y-2 text-gray-600 text-sm mb-4">
                          <div className="flex justify-between">
                            <span>Current Bet:</span>
                            <span className="font-medium">{formatCurrency(calculateTotalBetForTeamAndMatch(team, matchNumber))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Potential Return:</span>
                            <span className="font-medium text-indigo-600">{formatCurrency(calculatePotentialReturnForDisplay(team, odd, matchNumber))}</span>
                          </div>
                        </div>

                        <button
                          className={`w-full py-2 px-4 rounded-md transition-colors font-medium ${
                            hasBet
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          onClick={() => handleOpenModal(team, odd, matchNumber)}
                          disabled={availableBudget <= 0 && !hasBet}
                        >
                          {hasBet ? 'Remove Bet' : 'Place Bet'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No odds available.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Bet Summary</h3>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                <h4 className="font-semibold text-indigo-800 mb-2">Total Bets Placed</h4>
                <p className="text-2xl font-bold text-indigo-700">{formatCurrency(totalBet)}</p>

                <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, (totalBet / budget) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((totalBet / 100000) * 100).toFixed(1)}% of budget used
                </p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100 mt-4">
                <h4 className="font-semibold text-emerald-800 mb-2">Total Bets Placed</h4>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalBet)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100 mt-4">
                <h4 className="font-semibold text-red-800 mb-2">Available Budget</h4>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(availableBudget)}</p>
              </div>
              {/* <div className="flex items-center text-lg">
                <DollarSign className="text-emerald-500 mr-2" size={24} />
                <span className="font-semibold text-gray-700">Available Budget:</span>
                <span className="ml-2 text-xl font-bold text-emerald-600">{formatCurrency(availableBudget)}</span>
              </div> */}
            </div>

            <div className="md:w-1/2">
              <h4 className="font-semibold text-gray-700 mb-2">Potential Return</h4>
              {Object.entries(returnsSummary).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(returnsSummary).map(([teamName, data]) => (
                    <div key={teamName} className="p-2 mb-4 border border-gray-200 rounded-md">
                      <div className="font-semibold text-gray-700 mb-2">{teamName}</div>
                      {data.bets.map((bet, index) => (
                        <div key={`${teamName}-bet-${index}`} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-b-0">
                          <div>
                            <span className="text-gray-500">Odd: {bet.odd.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 mr-2">Bet: {formatCurrency(bet.amount)}</span>
                            <span className={`font-bold ${bet.profit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {formatCurrency(bet.profit)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-semibold text-gray-700">Total Potential Return:</span>
                        <span className={`font-bold ${data.totalProfit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(data.totalProfit)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No bets placed yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for placing bets */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-indigo-600 text-white p-4">
              <h3 className="text-lg font-semibold">
                {calculateTotalBetForTeamAndMatch(modalTeam, modalMatchIndex) > 0
                  ? `Update Bet on ${modalTeam}`
                  : `Odd is ${modalOdd.toFixed(2)}`}
              </h3>
            </div>

            <div className="p-6">

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your stake amount
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                  <input
                    type="number"
                    placeholder="Amount"
                    className="block w-full border rounded-md border-gray-300 pl-8 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2"
                    value={modalStake}
                    min={0}
                    onChange={handleStakeChange}
                  />
                </div>
                {stakeError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" /> {stakeError}
                  </p>
                )}
              </div>

              {modalStake && !stakeError && (
                <div className="mt-4 mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Stake amount:</span>
                    <span>{formatCurrency(parseFloat(modalStake))}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Potential return:</span>
                    <span className="text-emerald-600 font-bold text-lg">{formatCurrency(potentialReturn)}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={handlePlaceBet}
                  disabled={availableBudget < parseFloat(modalStake) && !(calculateTotalBetForTeamAndMatch(modalTeam, modalMatchIndex) > 0)}
                >
                  {calculateTotalBetForTeamAndMatch(modalTeam, modalMatchIndex) > 0
                    ? 'Update Bet'
                    : 'Place Bet'}
                </button>
                <button
                  className="py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
