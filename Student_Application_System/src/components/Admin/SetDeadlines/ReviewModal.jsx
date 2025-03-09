import Modal from "react-modal";

const ReviewModal = ({ isOpen, onClose, student }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white p-6 rounded-lg shadow-lg w-[20rem] md:w-[40rem] mx-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <h2 className="text-2xl font-bold text-[#0D0637] mb-4">
        Review Document
      </h2>
      <p>
        <strong>Student:</strong> {student?.student}
      </p>
      <p>
        <strong>Document:</strong> {student?.document}
      </p>
      <p>
        <strong>Reviewed By:</strong> {student?.reviewedby}
      </p>
      <p>
        <strong>Status:</strong> {student?.review}
      </p>
      <button
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
        onClick={onClose}
      >
        Close
      </button>
    </Modal>
  );
};

export default ReviewModal;
