
import React from 'react';

const Disclaimer: React.FC = () => {
  return (
    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 text-yellow-300 p-4 my-6 rounded-r-lg shadow-md">
      <p className="font-bold">Avviso Importante</p>
      <p className="text-sm">
        Questo è un gioco di simulazione. I crediti utilizzati per le scommesse sono virtuali, non hanno alcun valore nel mondo reale e non possono essere acquistati o riscossi. Questa app è solo a scopo di intrattenimento.
      </p>
    </div>
  );
};

export default Disclaimer;